import { mapProctoringEventsToAlerts } from '../AdminDashboard';

describe('mapProctoringEventsToAlerts', () => {
  test('maps flagged events correctly', () => {
    const events = [
      { event_id: 'e1', test_session_id: 'ts_1', event_type: 'camera_disconnect', severity: 'high', flagged: true, detected_at: '2025-12-01T09:42:00Z', event_metadata: { note: 'Camera disconnected' }, test_session: { candidate_name: 'Maya Patel', job_title: 'AI Research Engineer' } },
      { event_id: 'e2', test_session_id: 'ts_2', event_type: 'tab_switch', severity: 'low', flagged: false, detected_at: '2025-12-01T08:57:00Z', event_metadata: { note: 'Tab switched' }, test_session: { candidate_name: 'Jordan Miles', job_title: 'Product Data Scientist' } },
    ];

    const alerts = mapProctoringEventsToAlerts(events as any);
    expect(alerts.length).toBe(1);
    expect(alerts[0].candidate).toBe('Maya Patel');
    expect(alerts[0].job).toBe('AI Research Engineer');
    expect(alerts[0].reason).toContain('camera_disconnect');
  });
});
