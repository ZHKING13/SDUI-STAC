import Link from 'next/link';
import { Figure } from '@/components/Figure';
import { JoinForm } from '@/components/JoinForm';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { getHomeContent } from '@/lib/api';

// Doit rester une valeur littérale (contrainte de Next.js) ; identique à REVALIDATE_SECONDS.
export const revalidate = 300;

export default async function HomePage() {
  const c = await getHomeContent();
  const [firstParagraph, ...otherParagraphs] = c.history.paragraphs;

  return (
    <>
      <SiteHeader familyName={c.familyName} />
      <main id="contenu">
        <section className="container hero">
          <div className="hero__text">
            <p className="kicker">{c.hero.kicker}</p>
            <h1 className="hero__title">{c.hero.title}</h1>
            <p className="lead">{c.hero.intro}</p>
            <div className="actions">
              <Link href="#histoire" className="button button--primary">
                Découvrir notre histoire
              </Link>
              <Link href="#rejoindre" className="button button--outline">
                Vous êtes de la famille ?
              </Link>
            </div>
          </div>
          <div className="hero__figure">
            <Figure image={c.hero.image} placeholder={c.hero.imagePlaceholder} caption={c.hero.caption} ratio="4 / 3" />
          </div>
        </section>

        {c.stats.length > 0 && (
          <section aria-label="La famille en chiffres" className="container">
            <dl className="stats">
              {c.stats.map((stat) => (
                <div key={stat.label} className="stats__item">
                  <dt className="stats__label">{stat.label}</dt>
                  <dd className="stats__value">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section id="histoire" className="container section history">
          <div className="history__story">
            <p className="kicker">{c.history.kicker}</p>
            <h2 className="section__title">{c.history.title}</h2>
            <p className="body-text body-text--dropcap">{firstParagraph}</p>
            {otherParagraphs.map((paragraph) => (
              <p key={paragraph} className="body-text">
                {paragraph}
              </p>
            ))}
            {c.history.quote && <blockquote className="quote">« {c.history.quote} »</blockquote>}
          </div>
          {c.history.timeline.length > 0 && (
            <aside aria-labelledby="etapes" className="timeline">
              <h3 id="etapes" className="rubric">
                Grandes étapes
              </h3>
              <ol className="timeline__list">
                {c.history.timeline.map((step, index) => (
                  <li key={`${step.year}-${index}`} className="timeline__item">
                    <span className="timeline__year">{step.year}</span>
                    <span>{step.text}</span>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </section>

        <section id="racines" className="band band--vellum">
          <div className="container section roots">
            <div className="roots__map">
              <Figure image={c.roots.mapImage} placeholder={c.roots.mapPlaceholder} ratio="16 / 10" tone="vellum" />
            </div>
            <div className="roots__text">
              <p className="kicker">{c.roots.kicker}</p>
              <h2 className="section__title">{c.roots.title}</h2>
              <p className="body-text">{c.roots.text}</p>
              <p className="note">{c.roots.note}</p>
            </div>
          </div>
        </section>

        <section id="rassemble" className="container section">
          <p className="kicker">{c.together.kicker}</p>
          <h2 className="section__title">{c.together.title}</h2>
          <ul className="columns">
            {c.together.items.map((item) => (
              <li key={item.title} className="columns__item">
                <h3 className="columns__title">{item.title}</h3>
                <p className="body-text">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {c.nextEvent && (
          <section aria-labelledby="rendez-vous" className="container section--tight">
            <div className="card-double">
              <div className="card-double__inner">
                <div>
                  <p className="kicker kicker--small">{c.nextEvent.kicker}</p>
                  <h2 id="rendez-vous" className="event__title">
                    {c.nextEvent.title}
                  </h2>
                  <p className="note">{c.nextEvent.text}</p>
                </div>
                <Link href="/espace-famille" className="button button--primary">
                  Je suis de la famille, je m’inscris
                </Link>
              </div>
            </div>
          </section>
        )}

        <section id="rejoindre" aria-labelledby="rejoindre-titre" className="band band--ink">
          <div className="container section join">
            <div className="join__text">
              <p className="kicker kicker--light">{c.join.kicker}</p>
              <h2 id="rejoindre-titre" className="section__title">
                {c.join.title}
              </h2>
              <p className="body-text">{c.join.text}</p>
              <Link href="/espace-famille" className="join__login">
                Déjà membre ? Se connecter
              </Link>
            </div>
            <div className="join__form">
              <JoinForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter familyName={c.familyName} />
    </>
  );
}
