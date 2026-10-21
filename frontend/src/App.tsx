import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('確認中...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('エラー: APIにつながりません'))
  }, [])

  return (
    <main>
      <h1>Hello World</h1>
      <p>API の状態: {status}</p>
    </main>
  )
}

export default App
