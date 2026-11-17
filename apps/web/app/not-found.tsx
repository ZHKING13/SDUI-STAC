import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="contenu" className="container page">
      <h1 className="page-title">Page introuvable</h1>
      <p className="body-text">
        <Link href="/">Revenir à l’accueil</Link>
      </p>
    </main>
  );
}
