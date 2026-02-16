interface GameCard {
  id: string;
  emoji: string;
  label: string;
}

const GAMES: GameCard[] = [
  { id: 'almost', emoji: '\u{1F3AF}', label: 'Almost' },
  { id: 'sidequests', emoji: '\u{1F5FA}\uFE0F', label: 'Sidequests' },
  { id: 'elam', emoji: '\u{1F3DB}\uFE0F', label: 'Elam' },
  { id: 'interrogate', emoji: '\u{1F50D}', label: 'Interrogate' },
];

export default function CardFan() {
  return (
    <section className="card-fan" aria-label="Featured games">
      {GAMES.map((game) => (
        <button
          key={game.id}
          className="card-fan__card"
          aria-label={game.label}
          tabIndex={0}
        >
          <span className="card-fan__icon" aria-hidden="true">
            {game.emoji}
          </span>
          <span className="card-fan__label">{game.label}</span>
        </button>
      ))}
    </section>
  );
}
