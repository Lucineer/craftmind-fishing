#!/usr/bin/env python3
"""
Batch asset generator using Google AI Studio (Nano Banana Pro).
Generates Minecraft-style pixel art textures, sprites, and icons.
"""
import json
import sys
import os
import base64
import time
import urllib.request

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("ERROR: Set GEMINI_API_KEY env var")
    sys.exit(1)
MODEL = "gemini-3-pro-image-preview"
BASE_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "generated")
IMAGEN_MODEL = "imagen-4.0-fast-generate-001"

os.makedirs(BASE_DIR, exist_ok=True)

def generate_image(prompt, filename, subdir="", model=MODEL, aspect_ratio="1:1"):
    """Generate an image and save to disk."""
    outdir = os.path.join(BASE_DIR, subdir) if subdir else BASE_DIR
    os.makedirs(outdir, exist_ok=True)
    filepath = os.path.join(outdir, filename)
    
    if os.path.exists(filepath):
        print(f"  SKIP (exists): {filepath}")
        return filepath
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
    }
    
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
        
        parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        for p in parts:
            if "inlineData" in p:
                mime = p["inlineData"].get("mimeType", "image/jpeg")
                ext = "png" if "png" in mime else "jpg"
                actual_path = filepath if filepath.endswith(ext) else filepath.replace(filepath.split(".")[-1], ext)
                with open(actual_path, "wb") as f:
                    f.write(base64.b64decode(p["inlineData"]["data"]))
                size_kb = os.path.getsize(actual_path) / 1024
                print(f"  OK: {actual_path} ({size_kb:.0f}KB)")
                return actual_path
        print(f"  FAIL (no image): {filename}")
        return None
    except Exception as e:
        print(f"  ERROR: {filename} - {e}")
        return None

def batch_generate():
    print("=" * 60)
    print("NANO BANANA PRO — Minecraft Asset Generator")
    print("=" * 60)
    
    # === FISH SPECIES SPRITES ===
    print("\n🐟 FISH SPECIES SPRITES")
    fish_species = [
        ("king_salmon", "16x16 pixel art sprite of a Chinook King salmon fish, Minecraft style, bright silver with green and blue highlights, hooked jaw characteristic of mature kings"),
        ("coho_salmon", "16x16 pixel art sprite of a Silver Coho salmon fish, Minecraft style, bright silver with black spots on back, red on sides"),
        ("sockeye_salmon", "16x16 pixel art sprite of a Red Sockeye salmon fish, Minecraft style, brilliant red body, green head, spawning colors"),
        ("pink_salmon", "16x16 pixel art sprite of a Pink Humpy salmon fish, Minecraft style, small, olive green with dark spots and large hump"),
        ("chum_salmon", "16x16 pixel art sprite of a Chum Dog salmon fish, Minecraft style, calico-like tiger stripe pattern, spawning colors with purple and green bars"),
        ("halibut", "16x16 pixel art sprite of a Pacific Halibut fish, Minecraft style, large flat diamond-shaped white fish with brown mottled top, both eyes on one side"),
        ("sablefish_blackcod", "16x16 pixel art sprite of a Sablefish Black Cod, Minecraft style, dark gray-black body with iridescent blue-purple sheen, buttery looking"),
        ("pacific_cod", "16x16 pixel art sprite of a Pacific Cod fish, Minecraft style, brownish-olive with white underside, barbels on chin, speckled"),
        ("lingcod", "16x16 pixel art sprite of a Lingcod fish, Minecraft style, brown-green mottled with copper-orange spots, big mouth full of teeth, mean looking"),
        ("yelloweye_rockfish", "16x16 pixel art sprite of a Yelloweye Rockfish, Minecraft style, bright orange-red body with yellow eye, spiky fins"),
        ("dungeness_crab", "16x16 pixel art sprite of a Dungeness Crab, Minecraft style, reddish-brown shell, purple markings on claws, white underside"),
        ("king_crab", "16x16 pixel art sprite of a Red King Crab, Minecraft style, huge spiky dark red shell with long spiky legs, intimidating"),
        ("geoduck", "16x16 pixel art sprite of a Geoduck clam, Minecraft style, massive long siphon sticking out of a large oval shell buried in sand"),
        ("sea_cucumber", "16x16 pixel art sprite of a Sea Cucumber, Minecraft style, brown-red elongated blob with warty texture, underwater"),
        ("salmon_shark", "16x16 pixel art sprite of a Salmon Shark, Minecraft style, dark blue-gray torpedo shaped, white belly, powerful look"),
        ("orangespotted_rockfish", "16x16 pixel art sprite of a China Rockfish, Minecraft style, dark with bright orange and yellow spots, beautiful"),
    ]
    for name, prompt in fish_species:
        generate_image(prompt, f"{name}.jpg", subdir="species/fish")
    
    # === SHELLFISH & INVERTEBRATES ===
    print("\n🦀 SHELLFISH & INVERTEBRATES")
    inverts = [
        ("tanner_crab", "16x16 pixel art sprite of a Tanner Snow Crab, Minecraft style, smaller than king crab, brown with blue highlights, long legs"),
        ("shrimp_spot_prawn", "16x16 pixel art sprite of a Spot Prawn, Minecraft style, orange-red with white spots, curved body, long antennae"),
        ("scallop", "16x16 pixel art sprite of a Weathervane Scallop, Minecraft style, large fan-shaped shell with ridges, pinkish-white interior"),
        ("octopus_giant", "16x16 pixel art sprite of a Giant Pacific Octopus, Minecraft style, reddish with white spots, eight curling tentacles, intelligent eyes"),
        ("abalone", "16x16 pixel art sprite of an Abalone shell, Minecraft style, iridescent rainbow-colored oval shell with spiral pattern, ear-shaped holes along edge"),
        ("butter_clam", "16x16 pixel art sprite of a Butter Clam, Minecraft style, small oval shell, yellowish-white, classic clam shape"),
        ("urchin", "16x16 pixel art sprite of a Sea Urchin, Minecraft style, round purple-black ball covered in long sharp spines"),
        ("starfish", "16x16 pixel art sprite of a Sunflower Starfish, Minecraft style, large with 20+ arms, orange-red, common in Alaska"),
    ]
    for name, prompt in inverts:
        generate_image(prompt, f"{name}.jpg", subdir="species/invertebrates")
    
    # === MARINE MAMMALS ===
    print("\n🐋 MARINE MAMMAL SPRITES")
    mammals = [
        ("humpback_whale", "16x16 pixel art sprite of a Humpback Whale, Minecraft style, dark gray-blue, long pectoral fins, tubercles on head, breaching pose"),
        ("orca", "16x16 pixel art sprite of a Killer Whale Orca, Minecraft style, black and white striking pattern, tall dorsal fin"),
        ("sea_lion_steller", "16x16 pixel art sprite of a Steller Sea Lion, Minecraft style, large tan-brown body, thick neck, small ear flaps"),
        ("harbor_seal", "16x16 pixel art sprite of a Harbor Seal, Minecraft style, small gray-speckled round body, cute round head, no ear flaps"),
        ("sea_otter", "16x16 pixel art sprite of a Sea Otter floating on back, Minecraft style, brown furry, holding a clam on its belly, wrapped in kelp"),
        ("dalls_porpoise", "16x16 pixel art sprite of a Dall's Porpoise, Minecraft style, black and white body like mini orca, very stocky, rooster tail splash behind"),
        ("blue_whale", "16x16 pixel art sprite of a Blue Whale, Minecraft style, enormous long blue-gray body, tiny dorsal fin, pleated throat"),
        ("gray_whale", "16x16 pixel art sprite of a Gray Whale, Minecraft style, gray with barnacles and white patches, no dorsal fin, round head"),
        ("sperm_whale", "16x16 pixel art sprite of a Sperm Whale, Minecraft style, huge blocky dark gray head, tiny lower jaw, squared-off forehead"),
        ("minke_whale", "16x16 pixel art sprite of a Minke Whale, Minecraft style, small sleek dark gray-black body, white belly stripe on flippers"),
    ]
    for name, prompt in mammals:
        generate_image(prompt, f"{name}.jpg", subdir="species/mammals")
    
    # === BLOCK TEXTURES ===
    print("\n🧱 BLOCK TEXTURES")
    blocks = [
        ("kelp_block", "16x16 pixel art texture of underwater bull kelp, Minecraft style, brown-green tangled seaweed strands with floating bulb at top"),
        ("deep_water", "16x16 pixel art texture of deep ocean water, Minecraft style, very dark blue-green, deep and mysterious"),
        ("shallow_water", "16x16 pixel art texture of shallow coastal water, Minecraft style, light teal-blue, slightly transparent looking"),
        ("tidal_flat_sand", "16x16 pixel art texture of tidal flat sand, Minecraft style, wet brownish sand with small shells and worm holes"),
        ("rocky_pinnacle", "16x16 pixel art texture of underwater rocky pinnacle, Minecraft style, dark gray jagged rocks covered in barnacles and anemones"),
        ("mud_bottom", "16x16 pixel art texture of ocean mud bottom, Minecraft style, dark brown-black soft sediment"),
        ("gravel_bottom", "16x16 pixel art texture of ocean gravel bottom, Minecraft style, mixed small stones and pebbles, brown-gray"),
        ("coral_reef", "16x16 pixel art texture of coral reef, Minecraft style, colorful pink-purple-orange coral formations"),
        ("ice_block_glacier", "16x16 pixel art texture of glacier ice, Minecraft style, pale blue translucent with white cracks and bubbles"),
        ("salmon_egg", "16x16 pixel art texture of salmon eggs in gravel, Minecraft style, pinkish-orange translucent spheres in brown gravel"),
        ("wood_dock", "16x16 pixel art texture of weathered wooden dock planks, Minecraft style, gray-brown rough wood with gaps between planks"),
        ("ship_hull", "16x16 pixel art texture of steel fishing boat hull, Minecraft style, dark blue-gray painted steel with rust patches"),
    ]
    for name, prompt in blocks:
        generate_image(prompt, f"{name}.jpg", subdir="blocks")
    
    # === GEAR ITEMS ===
    print("\n🎣 GEAR & ITEM ICONS")
    items = [
        ("circle_hook", "32x32 pixel art icon of a circle hook fishing hook, Minecraft style, thick steel circle hook with sharp point curving inward"),
        ("dinglebar_jig", "32x32 pixel art icon of a heavy dinglebar jig, Minecraft style, large lead weight painted chartreuse with massive treble hook"),
        ("harpoon", "32x32 pixel art icon of a fishing harpoon, Minecraft style, long wooden shaft with barbed metal spear head"),
        ("crab_pot", "32x32 pixel art icon of a crab pot trap, Minecraft style, wire cage with funnel entry and buoy rope attached"),
        ("downrigger", "32x32 pixel art icon of a boat downrigger, Minecraft style, metal arm extending over water with cable and weight"),
        ("fish_finder", "32x32 pixel art icon of a fish finder sonar screen, Minecraft style, circular display showing fish arches and bottom contour in green"),
        ("wetsuit", "32x32 pixel art icon of a neoprene wetsuit, Minecraft style, black folded wetsuit with zipper visible"),
        ("dry_suit", "32x32 pixel art icon of a dry suit, Minecraft style, red waterproof suit with rubber seals at neck and wrists"),
        ("bear_spray", "32x32 pixel art icon of a can of bear spray pepper spray, Minecraft style, red-orange canister with spray nozzle"),
        ("fish_ticket", "32x32 pixel art icon of an Alaska fish ticket document, Minecraft style, official looking paper form with checkboxes"),
        ("seine_net", "32x32 pixel art icon of a purse seine net, Minecraft style, green mesh net with cork line floats on top and lead line on bottom"),
        ("longline", "32x32 pixel art icon of a longline fishing line with hooks, Minecraft style, main line with branch lines and circle hooks hanging"),
        ("gaff", "32x32 pixel art icon of a fishing gaff, Minecraft style, long wooden handle with large curved metal hook"),
        ("pot_puller", "32x32 pixel art icon of a hydraulic pot puller winch, Minecraft style, metal drum winch with motor and mounting bracket"),
        ("flasher", "32x32 pixel art icon of a fishing flasher attractor, Minecraft style, rotating chrome blade in fluorescent green with UV tape"),
    ]
    for name, prompt in items:
        generate_image(prompt, f"{name}.jpg", subdir="items/gear")
    
    # === NPC PORTRAITS ===
    print("\n👤 NPC PORTRAITS")
    npcs = [
        ("ernie_bartender", "Minecraft-style portrait of an old grizzled Alaska fisherman bartender, 70 years old, weathered face, gray beard, flannel shirt, dim bar background"),
        ("linda_marine", "Minecraft-style portrait of a knowledgeable middle-aged Alaska woman working at marine supply store, practical, wearing a Sitka hoodie, friendly but no-nonsense"),
        ("captain_pete", "Minecraft-style portrait of a rugged Alaska fishing boat captain, 50s, rain gear, salt-crusted mustache, squinting into the wind on a boat deck"),
        ("old_thomas", "Minecraft-style portrait of a Tlingit Alaska Native elder, wise face, wearing a cedar woven hat with formline design, near a totem pole"),
        ("sarah_biologist", "Minecraft-style portrait of a young ADF&G fish biologist, wearing binoculars and rain jacket, holding a clipboard, standing on a rocky shore"),
        ("captain_sig", "Minecraft-style portrait of a tough king crab boat captain, huge guy, orange survival suit, frozen beard, Bering Sea storm behind him"),
        ("jenna_diver", "Minecraft-style portrait of a young Alaska woman sea cucumber diver, wetsuit half-unzipped, wet hair, tough and confident, holding a catch bag"),
        ("dave_teacher", "Minecraft-style portrait of a Sitka Alaska high school teacher, friendly bearded guy, casual, standing in front of a whiteboard with a salmon drawing"),
        ("harbormaster_mary", "Minecraft-style portrait of an efficient Alaska harbormaster woman, uniform, clipboard, standing at harbor with boats behind"),
        ("the_tourist", "Minecraft-style portrait of a clueless tourist in Sitka Alaska, wearing a brand new rain jacket, camera around neck, mismatched clothes"),
    ]
    for name, prompt in npcs:
        generate_image(prompt, f"{name}.jpg", subdir="npcs")
    
    # === LOCATION ILLUSTRATIONS ===
    print("\n🏞️ LOCATION ART")
    locations = [
        ("sitka_harbor", "Minecraft-style pixel art landscape of Sitka Alaska harbor, wooden docks, fishing boats, mountains in background, overcast sky, rain"),
        ("mount_edgecumbe", "Minecraft-style pixel art landscape of Mount Edgecumbe volcano across Sitka Sound, conical mountain rising from the ocean, misty"),
        ("salmon_run_river", "Minecraft-style pixel art of Alaska salmon running up a forest river, leaping fish, bears on banks, green trees, mist"),
        ("kelp_forest", "Minecraft-style pixel art of underwater kelp forest, tall bull kelp reaching from bottom to surface, fish swimming through, sunlight filtering down"),
        ("halibut_hole", "Minecraft-style pixel art underwater scene of a deep fishing hole, dark blue water, sandy bottom, large halibut resting on bottom"),
        ("bear_fishing", "Minecraft-style pixel art of a brown bear standing in an Alaska river catching a salmon in its jaws, waterfall in background"),
        ("bubble_net", "Minecraft-style pixel art underwater scene of humpback whale bubble-net feeding, ring of bubbles, school of herring trapped, massive whale lunging upward"),
        ("seine_operation", "Minecraft-style pixel art of a purse seine fishing boat setting a net around salmon, helicopter view of the net circle, Alaska islands"),
        ("king_crab_boat", "Minecraft-style pixel art of a large king crab fishing boat in stormy Bering Sea, massive waves, deck crew working, dramatic lighting"),
        ("deer_lake", "Minecraft-style pixel art of a pristine alpine lake in Southeast Alaska, surrounded by old-growth forest and snow-capped mountains, misty, hidden"),
        ("ernies_bar", "Minecraft-style pixel art interior of a dimly lit Alaska fisherman's bar, wooden walls covered in photos, taxidermy fish on wall, beer taps"),
        ("lingcod_pinnacle", "Minecraft-style pixel art underwater scene of a rocky underwater pinnacle with lingcod hovering above it, dark water, dramatic lighting"),
    ]
    for name, prompt in locations:
        generate_image(prompt, f"{name}.jpg", subdir="locations")
    
    # === SPECIES EDUCATIONAL ILLUSTRATIONS ===
    print("\n📚 SPECIES INFO CARDS")
    cards = [
        ("salmon_lifecycle", "Minecraft-style educational diagram showing salmon lifecycle: egg, alevin, fry, smolt, adult ocean, returning spawner, all stages in a circle"),
        ("tide_diagram", "Minecraft-style educational diagram showing tidal cycle: high tide, low tide, spring tide, neap tide, moon phases, with depth markers"),
        ("depth_zones", "Minecraft-style educational diagram showing ocean depth zones near Sitka: intertidal, subtidal, kelp forest, rocky pinnacle, deep sound, abyss"),
        ("crab_pot_anatomy", "Minecraft-style educational diagram of a crab pot showing all parts: entrance funnel, escape cord, bait box, buoy line, pot mesh"),
    ]
    for name, prompt in cards:
        generate_image(prompt, f"{name}.jpg", subdir="education")
    
    # === BIRDS ===
    print("\n🦅 BIRD SPRITES")
    birds = [
        ("bald_eagle", "16x16 pixel art sprite of a Bald Eagle flying, Minecraft style, white head and tail, dark brown body, wings spread, fishing pose"),
        ("gull", "16x16 pixel art sprite of a Gull diving for fish, Minecraft style, white and gray bird, wings tucked, splashing into water"),
        ("puffin", "16x16 pixel art sprite of a Tufted Puffin, Minecraft style, black body, white face, orange beak, yellow tufts, standing on rock"),
        ("cormorant", "16x16 pixel art sprite of a Cormorant, Minecraft style, black diving bird, long neck, swimming on surface with wings spread to dry"),
    ]
    for name, prompt in birds:
        generate_image(prompt, f"{name}.jpg", subdir="species/birds")
    
    # === BEARS ===
    print("\n🐻 BEAR SPRITES")
    bears = [
        ("brown_bear", "16x16 pixel art sprite of a Brown Grizzly Bear standing in river, Minecraft style, large brown bear with hump, fishing stance, water splashing"),
        ("black_bear", "16x16 pixel art sprite of a Black Bear, Minecraft style, smaller black bear with lighter muzzle, climbing a tree or walking in forest"),
    ]
    for name, prompt in bears:
        generate_image(prompt, f"{name}.jpg", subdir="species/land")
    
    # === SPECIAL / EASTER EGGS ===
    print("\n✨ SPECIAL & EASTER EGGS")
    special = [
        ("bluefin_tuna", "16x16 pixel art sprite of a Bluefin Tuna, Minecraft style, massive metallic blue-silver torpedo, legendary size, glowing slightly"),
        ("narwhal", "16x16 pixel art sprite of a Narwhal, Minecraft style, gray-white body with a long spiral tusk, mythical appearance, arctic feel"),
        ("sea_turtle_green", "16x16 pixel art sprite of a Green Sea Turtle, Minecraft style, green shell with pattern, flippers, gentle looking, rare visitor"),
        ("sunfish_mola", "16x16 pixel art sprite of an Ocean Sunfish Mola Mola, Minecraft style, bizarre flat round body with tall dorsal fin, silver-gray"),
        ("giant_squid", "16x16 pixel art sprite of a Giant Squid, Minecraft style, long tentacles, red-orange, massive eye, mysterious deep sea creature"),
    ]
    for name, prompt in special:
        generate_image(prompt, f"{name}.jpg", subdir="species/special")
    
    # === SEASON / WEATHER ILLUSTRATIONS ===
    print("\n🌦️ WEATHER & SEASON ART")
    weather = [
        ("weather_rain", "Minecraft-style pixel art of Southeast Alaska rainy day on the ocean, gray sky, rain on water, fishing boat, moody and atmospheric"),
        ("weather_storm", "Minecraft-style pixel art of Alaska ocean storm, massive waves, dark sky, lightning, fishing boat riding huge swell"),
        ("weather_fog", "Minecraft-style pixel art of thick Sitka fog, barely visible boat silhouette, eerie, everything muted gray, buoy visible nearby"),
        ("weather_clear_rare", "Minecraft-style pixel art of rare sunny day in Sitka, blue sky, mountains, calm water, mirror reflections, magical"),
        ("weather_aurora", "Minecraft-style pixel art of northern lights aurora borealis over Sitka Sound at night, green and purple bands dancing in sky, stars, mountains"),
    ]
    for name, prompt in weather:
        generate_image(prompt, f"{name}.jpg", subdir="weather")
    
    print("\n" + "=" * 60)
    print("DONE! Check assets/generated/ for all outputs.")
    print("=" * 60)

if __name__ == "__main__":
    batch_generate()
