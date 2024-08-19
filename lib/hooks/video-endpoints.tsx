


import React, { useState } from 'react';

interface VideoDetailsFetcherProps {
  channelId: string;
}

const VideoDetailsFetcher = ({ channelId }: VideoDetailsFetcherProps) => {
  const [response, setResponse] = useState<string | null>(null);

  const fetchVideoDetails = () => {
    const data = new FormData();
    data.append('videoId', channelId);

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener('readystatechange', function () {
      if (this.readyState === this.DONE) {
        setResponse(this.responseText);
      }
    });

    xhr.open('POST', 'https://youtube-scraper-2023.p.rapidapi.com/video_details');
    xhr.setRequestHeader('x-rapidapi-key', 'c816baa98emsh14e037a921a87a1p1dafb2jsn99f545578dcd');
    xhr.setRequestHeader('x-rapidapi-host', 'youtube-scraper-2023.p.rapidapi.com');

    xhr.send(data);
  };

  return (
    <div>
      <button onClick={fetchVideoDetails}>Fetch Video Details</button>
      {response && <pre>{response}</pre>}
    </div>
  );
};

export default VideoDetailsFetcher;
