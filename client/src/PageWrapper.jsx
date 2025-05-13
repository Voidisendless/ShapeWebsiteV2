function PageWrapper({ title, iconClass, children }) {
  return (
    <div className="page">
      <div className="form-container">
        <div className="logo">
          <i className={iconClass}></i>
          <span>SecureAuth</span>
        </div>
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export default PageWrapper;
