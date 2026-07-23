import { useEffect, useState, type ReactElement } from "react";
import { useInventory } from "./InventoryProvider";
import { RoomMap } from "./RoomMap";
import { MakerKiosk } from "./MakerKiosk";
import { nextScene, TV_SCENES, TV_ROTATION_MS, type SceneId } from "../utils/sceneRotation";
import "./tvDisplay.css";

function AmbientScene() {
    const { makerItems, projectIdeas } = useInventory();
    const tools = makerItems.filter(i => i.type === "tool").slice(0, 4);
    const ideas = projectIdeas.slice(0, 4);
    return (
        <div className="tv-scene">
            <div className="tv-title">Welcome to the VIVITA Makerspace</div>
            <div className="tv-card-grid">
                <div className="tv-card">
                    <strong>Tools available</strong>
                    <ul>{tools.map(t => <li key={t.name}>{t.name}</li>)}</ul>
                </div>
                <div className="tv-card">
                    <strong>Try making</strong>
                    <ul>{ideas.map(p => <li key={p.id}>{p.name}</li>)}</ul>
                </div>
            </div>
            <div className="tv-card">Remember: ask an adult before using tools marked for supervision.</div>
        </div>
    );
}

function RoomMapScene() {
    const { floors, materials } = useInventory();
    return (
        <div className="tv-scene tv-scene--map">
            <RoomMap floors={floors} materials={materials} />
        </div>
    );
}

function KioskMirrorScene() {
    return (
        <div className="tv-scene">
            <MakerKiosk />
        </div>
    );
}

function VotingScene() {
    return (
        <div className="tv-scene">
            <div className="tv-title">Voting games</div>
            <div className="tv-card">Coming soon — vote from your tablet.</div>
        </div>
    );
}

const SCENE_COMPONENTS: Record<SceneId, () => ReactElement> = {
    ambient: AmbientScene,
    roomMap: RoomMapScene,
    kioskMirror: KioskMirrorScene,
    voting: VotingScene,
};

export function TvDisplay() {
    const [scene, setScene] = useState<SceneId>(TV_SCENES[0]);

    useEffect(() => {
        const timer = setInterval(() => {
            setScene(current => nextScene(current, TV_SCENES));
        }, TV_ROTATION_MS);
        return () => clearInterval(timer);
    }, []);

    const requestFullscreen = () => {
        document.documentElement.requestFullscreen?.().catch(() => {});
    };

    const SceneComponent = SCENE_COMPONENTS[scene];

    return (
        <div className="tv-root">
            <div className="tv-fullscreen-hint" onClick={requestFullscreen}>Tap for fullscreen</div>
            <SceneComponent />
            <div className="tv-dots">
                {TV_SCENES.map(id => (
                    <div key={id} className={id === scene ? "tv-dot tv-dot--active" : "tv-dot"} />
                ))}
            </div>
        </div>
    );
}

export default TvDisplay;
