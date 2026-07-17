type PlaceholderPageProps = {
  moduleName: string;
};

export function PlaceholderPage({ moduleName }: PlaceholderPageProps) {
  return (
    <div className="empty-screen">
      <div>
        <div className="eyebrow">Ready for implementation</div>
        <h2>{moduleName}</h2>
        <p>This screen area is intentionally empty until the workflow screen is implemented.</p>
      </div>
    </div>
  );
}
