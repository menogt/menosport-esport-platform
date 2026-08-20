type GameHeaderPlaceholderProps = {
  game: string;
  accent: string;
};

export default function GameHeaderPlaceholder({ game, accent }: GameHeaderPlaceholderProps) {
  return (
    <div className="game-header-placeholder" style={{ "--placeholder-accent": accent } as React.CSSProperties}>
      <span>[GAME_HEADER_IMAGE: {game}]</span>
      <i />
    </div>
  );
}
