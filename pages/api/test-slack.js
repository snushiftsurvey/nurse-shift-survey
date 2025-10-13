import errorHandler from '../../lib/errorHandler'

export default function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 테스트용 에러 발생
    errorHandler.logError('Slack 알림 테스트입니다', new Error('테스트 에러'), {
      component: 'TestAPI',
      action: 'slack-test',
      userId: 'test-user'
    })

    res.status(200).json({ 
      success: true, 
      message: 'Slack 알림이 전송되었습니다!' 
    })

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
