const PageHeader = ({ title, subtitle }) => {
  return (
    <div className="card-header mb-8">
      <h1 className="card-header-title">{title}</h1>
      <p className="card-header-subtitle">{subtitle}</p>
    </div>
  );
};

export default PageHeader;
