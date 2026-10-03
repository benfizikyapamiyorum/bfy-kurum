import { Link } from 'react-router-dom'

export function Bulunamadi() {
  return (
    <div className="sayfa">
      <h1>Sayfa bulunamadı.</h1>
      <p className="soluk">Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link to="/" className="dugme ana">
        Ana sayfaya dön
      </Link>
    </div>
  )
}
