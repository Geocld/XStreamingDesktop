const Loading = ({ loadingText }) => {
  return (
    <div className="loading user-select-none">
      <div>
        <img src='/images/loading.svg' alt="" />
      </div>
      <div className="loadingText">{loadingText}</div>
    </div>
  );
};

export default Loading;
