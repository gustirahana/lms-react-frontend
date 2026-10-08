import { io } from 'socket.io-client';
import { appConfig } from './config.js';

const socketOptions = {
  autoConnect: false,
  path: '/socket.io',
  withCredentials: true,
  auth: {
    appName: appConfig.name,
    appVersion: appConfig.version,
    appDevice: appConfig.device,
  },
};

export function openRealtimeChannels({ onNotification, onNotifications, onNotificationRead, onError, onClassroomHistory, onRoomError }) {
  const notifications = io(`${appConfig.socketOrigin}/notifications`, socketOptions);
  const classroom = io(`${appConfig.socketOrigin}/classroom`, socketOptions);
  let activeCourseId = null;

  const joinActiveCourse = () => {
    const courseId = activeCourseId;
    if (!courseId) return;
    classroom.timeout(8000).emit('course:join', { courseId }, (error, result) => {
      if (activeCourseId !== courseId) {
        if (classroom.connected) classroom.emit('course:leave', { courseId });
        return;
      }
      if (error) {
        onRoomError('COURSE_JOIN_TIMEOUT');
        return;
      }
      if (result?.ok) {
        classroom.timeout(8000).emit('classroom:history:request', { courseId }, (error, history) => {
          if (activeCourseId !== courseId) return;
          if (error) {
            onRoomError('HISTORY_UNAVAILABLE');
            return;
          }
          if (history?.ok && Array.isArray(history.messages)) {
            onClassroomHistory(courseId, history.messages);
          } else if (!history?.ok) {
            onRoomError(history?.error || 'HISTORY_UNAVAILABLE');
          }
        });
      } else {
        onRoomError(result?.error || 'COURSE_JOIN_FAILED');
      }
    });
  };

  notifications.on('connect', () => {
    notifications.timeout(8000).emit('notification:subscribe', (error, result) => {
      if (error || !result?.subscribed) {
        onError(error || new Error('Notification subscription failed'));
        return;
      }
      onNotifications(Array.isArray(result.notifications) ? result.notifications : []);
    });
  });
  notifications.on('notification:new', onNotification);
  notifications.on('notification:read', onNotificationRead);
  notifications.on('connect_error', onError);
  classroom.on('connect', joinActiveCourse);
  classroom.on('connect_error', onError);

  notifications.connect();
  classroom.connect();

  return {
    setCourse(courseId) {
      if (activeCourseId && classroom.connected) classroom.emit('course:leave', { courseId: activeCourseId });
      activeCourseId = courseId || null;
      if (activeCourseId && classroom.connected) joinActiveCourse();
    },
    sendClassroomMessage(courseId, body, onResult) {
      if (!classroom.connected) {
        onResult?.({ ok: false, error: 'NOT_CONNECTED' });
      } else if (typeof body === 'string' && body.trim()) {
        classroom.timeout(8000).emit('classroom:message:send', {
          courseId,
          body: body.trim(),
        }, (error, result) => onResult?.(error ? { ok: false, error: 'TIMEOUT' } : result));
      }
    },
    onClassroomMessage(callback) {
      classroom.on('classroom:message:new', callback);
      return () => classroom.off('classroom:message:new', callback);
    },
    markNotificationRead(notificationId, onResult) {
      if (notifications.connected && typeof notificationId === 'string') {
        notifications.timeout(8000).emit('notification:read', { notificationId }, (error, result) => {
          onResult?.(error ? { ok: false, error: 'TIMEOUT' } : result);
        });
      } else {
        onResult?.({ ok: false, error: 'NOT_CONNECTED' });
      }
    },
    close() {
      if (activeCourseId && classroom.connected) {
        classroom.emit('course:leave', { courseId: activeCourseId });
      }
      notifications.disconnect();
      classroom.disconnect();
    },
  };
}
