import Image from 'next/image';

interface FigureProps {
  image?: { src: string; alt: string; caption?: string };
  placeholder: string;
  caption?: string;
  ratio: '4 / 3' | '16 / 10';
  tone?: 'paper' | 'vellum';
}

/** Photo publiée, ou cadre de remplacement tant que la famille n'a pas fourni l'image. */
export function Figure({ image, placeholder, caption, ratio, tone = 'paper' }: FigureProps) {
  const legend = image?.caption ?? caption;
  return (
    <figure className="figure">
      {image ? (
        <div className="figure__frame" style={{ aspectRatio: ratio }}>
          <Image src={image.src} alt={image.alt} fill sizes="(max-width: 900px) 100vw, 50vw" className="figure__img" unoptimized />
        </div>
      ) : (
        <div className={`figure__frame figure__placeholder figure__placeholder--${tone}`} style={{ aspectRatio: ratio }} role="img" aria-label={placeholder}>
          {placeholder}
        </div>
      )}
      {legend && <figcaption className="figure__caption">{legend}</figcaption>}
    </figure>
  );
}
