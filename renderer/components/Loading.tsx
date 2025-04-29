const Loading = ({ loadingText }) => {
  return (
    <div className="loading">
      <div>
        <img src='/images/loading.svg' alt="" />
      </div>
      <div className="loadingText">{loadingText}</div>
    </div>
  );
};

export default Loading;
