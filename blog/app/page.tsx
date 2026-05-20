import IdCard from "./portfolio/IdCard";
import Tabs from "./portfolio/Tabs";
import Tweaks from "./portfolio/Tweaks";

export default function Home() {
  return (
    <>
      <div className="pf-shell">
        <IdCard />
        <Tabs />
      </div>
      <Tweaks />
    </>
  );
}
