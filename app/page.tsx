import { MomentsFeed } from "@/components/moments-feed";
const siteBeian = process.env.NEXT_PUBLIC_SITE_BEIAN || null;
export default function Home() {
  return (
    <div>
      <MomentsFeed />
      {siteBeian && <a href="https://beian.miit.gov.cn/" className="fixed bottom-0 left-0 right-0 p-4 text-xs text-gray-400">{siteBeian}</a>}
    </div>
  );
}
