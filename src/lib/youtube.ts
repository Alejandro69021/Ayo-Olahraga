/**
 * Extracts YouTube video ID and returns a clean, looped, autoplaying embed URL
 * exactly like workout.cool / Fit'distance format.
 */
export function getYouTubeEmbedUrl(urlOrId: string, autoplay: boolean = true): string {
  if (!urlOrId) return "";

  let videoId = urlOrId.trim();

  // If full URL provided, extract video ID
  if (videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
    try {
      const parsed = new URL(videoId);
      if (parsed.searchParams.get("v")) {
        videoId = parsed.searchParams.get("v")!;
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.replace("/embed/", "").split("?")[0];
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.replace("/shorts/", "").split("?")[0];
      } else if (parsed.hostname === "youtu.be") {
        videoId = parsed.pathname.substring(1).split("?")[0];
      }
    } catch {
      // fallback regex
      const match = urlOrId.match(/(?:embed\/|v=|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (match) videoId = match[1];
    }
  }

  // Construct clean, distraction-free embed that loops endlessly like an animated 3D clip
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: "1", // required for reliable autoplay in all browsers
    loop: "1",
    playlist: videoId, // required by YouTube API for infinite single-video loop
    controls: "1",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    iv_load_policy: "3",
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function getYouTubeThumbnailUrl(urlOrId: string): string {
  if (!urlOrId) return "";
  let videoId = urlOrId.trim();
  if (videoId.includes("youtube.com") || videoId.includes("youtu.be")) {
    const match = urlOrId.match(/(?:embed\/|v=|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) videoId = match[1];
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

