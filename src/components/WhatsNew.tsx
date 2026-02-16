interface NewsItem {
  id: string;
  emoji: string;
  title: string;
  description: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: '1',
    emoji: '\u{1F3B2}',
    title: 'Game Night This Friday',
    description: 'Join us for an evening of Catan, Azul, and more at the community hall.',
  },
  {
    id: '2',
    emoji: '\u{1F0CF}',
    title: 'New Arrivals: Wingspan Expansion',
    description: 'The Oceania expansion is now available to borrow from our library.',
  },
];

export default function WhatsNew() {
  return (
    <section className="whats-new" aria-label="What's new">
      <h2 className="whats-new__heading">What's New</h2>
      {NEWS_ITEMS.map((item) => (
        <article key={item.id} className="whats-new__item">
          <div className="whats-new__thumb" aria-hidden="true">
            {item.emoji}
          </div>
          <div className="whats-new__text">
            <div className="whats-new__title">{item.title}</div>
            <p className="whats-new__desc">{item.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
