import { supabase } from '@/lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabase
      .from('researcher_profiles')
      .select('signature_image')
      .eq('name', '정수인')
      .single()

    if (error) {
      console.error('DB 조회 오류:', error)
      return res.status(500).json({ error: 'DB 조회 실패' })
    }

    if (!data || !data.signature_image) {
      return res.status(404).json({ error: '서명 데이터 없음' })
    }

    return res.status(200).json({
      signature_image: data.signature_image,
      length: data.signature_image.length,
      format: data.signature_image.startsWith('data:image/png') ? 'PNG' : 
              data.signature_image.startsWith('data:image/jpeg') ? 'JPEG' : 'Unknown'
    })

  } catch (error) {
    console.error('API 오류:', error)
    return res.status(500).json({ error: '서버 오류' })
  }
}
