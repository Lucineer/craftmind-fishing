#!/usr/bin/env python3
"""
Multi-repo Minecraft asset generator using Google AI Studio.
Tier strategy:
  - imagen-4.0-fast: bulk sprites, simple textures (cheapest, good enough)
  - gemini-2.5-flash-image (Nano Banana): mid-tier scenes, NPC portraits  
  - gemini-3-pro-image-preview (Nano Banana Pro): hero art, key illustrations, location splash screens
"""
import json
import sys
import os
import base64
import time
import urllib.request
import random

API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBKQBB_YP7kg6AMWv1KUBjmqLxQcRYSFcM")

# Model tiers
MODELS = {
    "fast": "imagen-4.0-fast-generate-001",        # cheapest, bulk work
    "mid": "gemini-2.5-flash-image",                 # Nano Banana - good quality
    "pro": "gemini-3-pro-image-preview",             # Nano Banana Pro - hero art
}

REPOS = {
    "craftmind-fishing": "/home/lucineer/projects/craftmind-fishing",
    "craftmind-studio": "/home/lucineer/projects/craftmind-studio",
    "craftmind-courses": "/home/lucineer/projects/craftmind-courses",
    "craftmind-researcher": "/home/lucineer/projects/craftmind-researcher",
    "craftmind-herding": "/home/lucineer/projects/craftmind-herding",
    "craftmind-circuits": "/home/lucineer/projects/craftmind-circuits",
    "craftmind-ranch": "/home/lucineer/projects/craftmind-ranch",
}

# Rate limiting
RATE_LIMIT_DELAY = {"fast": 8, "mid": 12, "pro": 18}  # seconds between requests (conservative for free tier)
last_request_time = {"fast": 0, "mid": 0, "pro": 0}
RATE_LIMIT_BACKOFF = 90  # extra wait after 429 error
last_429_time = 0

# Track API calls
stats = {"fast": 0, "mid": 0, "pro": 0, "errors": 0, "skipped": 0}

def log(msg):
    print(msg, flush=True)

def rate_limit_wait(tier):
    """Wait to avoid rate limiting."""
    global last_429_time
    # If we got a 429 recently, wait extra
    since_429 = time.time() - last_429_time
    if since_429 < RATE_LIMIT_BACKOFF:
        wait = RATE_LIMIT_BACKOFF - since_429
        log(f"  RATE LIMIT: waiting {wait:.0f}s...")
        time.sleep(wait)
    
    # Normal tier-based delay
    since_last = time.time() - last_request_time[tier]
    if since_last < RATE_LIMIT_DELAY[tier]:
        time.sleep(RATE_LIMIT_DELAY[tier] - since_last)
    last_request_time[tier] = time.time()

def generate_imagen(prompt, filepath, model="fast"):
    """Generate using Imagen model (different API)."""
    if os.path.exists(filepath):
        stats["skipped"] += 1
        log(f"  SKIP: {os.path.basename(filepath)}")
        return True
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    rate_limit_wait(model)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELS[model]}:predict?key={API_KEY}"
    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {"sampleCount": 1}
    }
    
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=90) as resp:
            result = json.loads(resp.read())
        
        preds = result.get("predictions", [])
        if preds:
            b64 = preds[0].get("bytesBase64Encoded", "")
            mime = preds[0].get("mimeType", "image/jpeg")
            ext = "png" if "png" in mime else "jpg"
            actual = filepath if filepath.endswith(ext) else filepath.rsplit(".", 1)[0] + f".{ext}"
            with open(actual, "wb") as f:
                f.write(base64.b64decode(b64))
            size_kb = os.path.getsize(actual) / 1024
            log(f"  OK [{model}]: {os.path.basename(actual)} ({size_kb:.0f}KB)")
            stats[model] += 1
            return True
        log(f"  FAIL (no prediction): {os.path.basename(filepath)}")
        stats["errors"] += 1
        return False
    except urllib.error.HTTPError as e:
        if e.code == 429:
            global last_429_time
            last_429_time = time.time()
            log(f"  429 RATE LIMITED: {os.path.basename(filepath)} - backing off 30s")
            # Retry once after backoff
            time.sleep(RATE_LIMIT_BACKOFF)
            rate_limit_wait(model)
            try:
                data = json.dumps(payload).encode()
                req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=90) as resp:
                    result = json.loads(resp.read())
                preds = result.get("predictions", [])
                if preds:
                    b64 = preds[0].get("bytesBase64Encoded", "")
                    mime = preds[0].get("mimeType", "image/jpeg")
                    ext = "png" if "png" in mime else "jpg"
                    actual = filepath if filepath.endswith(ext) else filepath.rsplit(".", 1)[0] + f".{ext}"
                    with open(actual, "wb") as f:
                        f.write(base64.b64decode(b64))
                    size_kb = os.path.getsize(actual) / 1024
                    log(f"  RETRY OK [{model}]: {os.path.basename(actual)} ({size_kb:.0f}KB)")
                    stats[model] += 1
                    return True
            except Exception as e2:
                log(f"  RETRY FAILED: {str(e2)[:80]}")
        else:
            log(f"  ERROR [{model}]: {os.path.basename(filepath)} - HTTP {e.code}")
        stats["errors"] += 1
        return False
    except Exception as e:
        log(f"  ERROR [{model}]: {os.path.basename(filepath)} - {str(e)[:100]}")
        stats["errors"] += 1
        return False

def generate_gemini(prompt, filepath, model="mid"):
    """Generate using Gemini multimodal model (different API)."""
    if os.path.exists(filepath):
        stats["skipped"] += 1
        log(f"  SKIP: {os.path.basename(filepath)}")
        return True
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    rate_limit_wait(model)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODELS[model]}:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]}
    }
    
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=90) as resp:
            result = json.loads(resp.read())
        
        parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        for p in parts:
            if "inlineData" in p:
                d = p["inlineData"]
                mime = d.get("mimeType", "image/jpeg")
                ext = "png" if "png" in mime else "jpg"
                actual = filepath if filepath.endswith(ext) else filepath.rsplit(".", 1)[0] + f".{ext}"
                with open(actual, "wb") as f:
                    f.write(base64.b64decode(d["data"]))
                size_kb = os.path.getsize(actual) / 1024
                log(f"  OK [{model}]: {os.path.basename(actual)} ({size_kb:.0f}KB)")
                stats[model] += 1
                return True
        log(f"  FAIL (no image): {os.path.basename(filepath)}")
        stats["errors"] += 1
        return False
    except urllib.error.HTTPError as e:
        if e.code == 429:
            global last_429_time
            last_429_time = time.time()
            log(f"  429 RATE LIMITED: {os.path.basename(filepath)} - backing off 30s")
            time.sleep(RATE_LIMIT_BACKOFF)
            rate_limit_wait(model)
            try:
                data = json.dumps(payload).encode()
                req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=90) as resp:
                    result = json.loads(resp.read())
                parts = result.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                for p in parts:
                    if "inlineData" in p:
                        d = p["inlineData"]
                        mime = d.get("mimeType", "image/jpeg")
                        ext = "png" if "png" in mime else "jpg"
                        actual = filepath if filepath.endswith(ext) else filepath.rsplit(".", 1)[0] + f".{ext}"
                        with open(actual, "wb") as f:
                            f.write(base64.b64decode(d["data"]))
                        size_kb = os.path.getsize(actual) / 1024
                        log(f"  RETRY OK [{model}]: {os.path.basename(actual)} ({size_kb:.0f}KB)")
                        stats[model] += 1
                        return True
            except Exception as e2:
                log(f"  RETRY FAILED: {str(e2)[:80]}")
        else:
            log(f"  ERROR [{model}]: {os.path.basename(filepath)} - HTTP {e.code}")
        stats["errors"] += 1
        return False
    except Exception as e:
        log(f"  ERROR [{model}]: {os.path.basename(filepath)} - {str(e)[:100]}")
        stats["errors"] += 1
        return False

def gen(prompt, filepath, tier="fast"):
    """Smart dispatch - Imagen for fast, Gemini for mid/pro."""
    if tier == "fast":
        return generate_imagen(prompt, filepath, "fast")
    else:
        return generate_gemini(prompt, filepath, tier)

def p(repo, subdir):
    """Get full path for a repo's assets."""
    return os.path.join(REPOS[repo], "assets", "generated", subdir)

# ============================================================
# CRAFTMIND FISHING — Priority 1, most assets
# ============================================================
def gen_fishing():
    r = "craftmind-fishing"
    log("=" * 60)
    log("🐟 CRAFTMIND FISHING — Bulk Asset Generation")
    log("=" * 60)
    
    # --- Additional fish species we missed ---
    log("\n🐟 ADDITIONAL FISH SPRITES (fast)")
    fish = [
        ("eulachon", "16x16 pixel art Minecraft sprite of eulachon candlefish, small silvery smelt, oily, school of fish"),
        ("pacific_mackerel", "16x16 pixel art Minecraft sprite of Pacific mackerel, green-blue striped, schooling fish"),
        ("herring", "16x16 pixel art Minecraft sprite of Pacific herring, small silver fish with blue-green back, schooling"),
        ("squid", "16x16 pixel art Minecraft sprite of Pacific squid, reddish-brown with tentacles, underwater"),
        ("dolly_varden", "16x16 pixel art Minecraft sprite of Dolly Varden char trout, spotted, pink spots on sides, freshwater"),
        ("cutthroat_trout", "16x16 pixel art Minecraft sprite of Coastal Cutthroat Trout, green back, pink stripe along side"),
        ("steelhead", "16x16 pixel art Minecraft sprite of Steelhead rainbow trout, silvery, spotted, ocean-going"),
        ("rock_greenling", "16x16 pixel art Minecraft sprite of Rock Greenling, brown-green with reddish spots, kelp forest fish"),
        ("kelp_greenling", "16x16 pixel art Minecraft sprite of Kelp Greenling, brownish with white and yellow stripes, kelp fish"),
        ("wolffish", "16x16 pixel art Minecraft sprite of Wolffish, ugly eel-like brown fish with big teeth, deep water"),
        ("sturgeon", "16x16 pixel art Minecraft sprite of White Sturgeon, large ancient gray fish, bony plates, long snout"),
        ("sand_lance", "16x16 pixel art Minecraft sprite of Pacific Sand Lance sand eel, small silvery burrowing fish"),
        ("skate", "16x16 pixel art Minecraft sprite of Big Skate ray, flat diamond-shaped, spotted, long tail, deep water"),
        ("spiny_dogfish", "16x16 pixel art Minecraft sprite of Spiny Dogfish shark, small gray shark with white spots, common"),
        ("albacore_tuna", "16x16 pixel art Minecraft sprite of Albacore Tuna, metallic blue-silver, long pectoral fins, streamlined"),
        ("yellowfin_tuna", "16x16 pixel art Minecraft sprite of Yellowfin Tuna, large blue with yellow fins and yellow stripe, powerful"),
        ("swordfish", "16x16 pixel art Minecraft sprite of Swordfish, large dark blue with silver underside, long pointed bill"),
        ("marlin", "16x16 pixel art Minecraft sprite of Blue Marlin, massive cobalt blue with silver sides, spear bill, striped"),
        ("canary_rockfish", "16x16 pixel art Minecraft sprite of Canary Rockfish, bright orange-yellow, deep water rockfish"),
        ("quillback_rockfish", "16x16 pixel art Minecraft sprite of Quillback Rockfish, mottled brown-orange with spiky dorsal fin"),
        ("china_rockfish", "16x16 pixel art Minecraft sprite of China Rockfish, dark blue-black with bright yellow and white spots"),
        ("black_rockfish", "16x16 pixel art Minecraft sprite of Black Rockfish, dark blue-black with white belly, schooling near surface"),
        ("rougheye_rockfish", "16x16 pixel art Minecraft sprite of Rougheye Rockfish, red with bright red eyes, very old deep fish"),
        ("thornyhead", "16x16 pixel art Minecraft sprite of Shortspine Thornyhead, red-orange, spiky, deep water, orange roughy-like"),
        ("sanddab", "16x16 pixel art Minecraft sprite of Pacific Sanddab, small flatfish, sandy brown, both eyes on left side"),
    ]
    for name, prompt in fish:
        gen(prompt, p(r, f"species/fish/{name}.jpg"), "fast")

    # --- More invertebrates ---
    log("\n🦀 MORE SHELLFISH (fast)")
    inverts = [
        ("mussel", "16x16 pixel art Minecraft sprite of Blue Mussel, dark blue-black elongated shell, clumped together"),
        ("cockle", "16x16 pixel art Minecraft sprite of Heart Cockle, rounded ribbed shell, pinkish-white, shallow water"),
        ("dulse_seaweed", "16x16 pixel art Minecraft sprite of Dulse seaweed, red-purple edible seaweed, hand-shaped fronds"),
        ("bull_kelp", "16x16 pixel art Minecraft sprite of Bull Kelp plant, long brown stalk with floating bulb at top, underwater"),
        ("eelgrass", "16x16 pixel art Minecraft sprite of Eelgrass bed, green underwater grass swaying, fish habitat"),
        ("fireweed", "16x16 pixel art Minecraft sprite of Fireweed flower, tall pink-purple flowers on stalk, green leaves, Alaska state flower"),
        ("beach_asparagus", "16x16 pixel art Minecraft sprite of Beach Asparagus Salicornia, small green salty edible plant on beach"),
    ]
    for name, prompt in inverts:
        gen(prompt, p(r, f"species/plants/{name}.jpg"), "fast")

    # --- More mammals ---
    log("\n🐋 MORE MARINE MAMMALS (fast)")
    mammals = [
        ("fin_whale", "16x16 pixel art Minecraft sprite of Fin Whale, very large sleek dark gray body, white underside, small fin"),
        ("beluga_whale", "16x16 pixel art Minecraft sprite of Beluga Whale, small white whale, round head, cute, ghostly white"),
        ("gray_whale_calves", "16x16 pixel art Minecraft sprite of Gray Whale mother and calf, dark gray with barnacles, small calf beside"),
        ("harbor_porpoise", "16x16 pixel art Minecraft sprite of Harbor Porpoise, tiny dark gray, small triangular dorsal fin"),
        ("white_sided_dolphin", "16x16 pixel art Minecraft sprite of Pacific White-Sided Dolphin, acrobatic, black back white belly gray sides"),
    ]
    for name, prompt in mammals:
        gen(prompt, p(r, f"species/mammals/{name}.jpg"), "fast")

    # --- Block textures (bulk) ---
    log("\n🧱 BLOCK TEXTURES (fast)")
    blocks = [
        ("salmon_block_raw", "16x16 pixel art Minecraft texture of raw salmon as food item, pink-red fillet with silver skin"),
        ("halibut_block_raw", "16x16 pixel art Minecraft texture of raw halibut fillet, white firm flesh, clean cut"),
        ("crab_meat_block", "16x16 pixel art Minecraft texture of cooked crab meat lump, white and red, in a wooden bowl"),
        ("salmon_smoked", "16x16 pixel art Minecraft texture of smoked salmon, deep orange-red, sliced, on cedar plank"),
        ("blackcod_cooked", "16x16 pixel art Minecraft texture of cooked sablefish black cod, buttery white flesh, flaky, luxurious"),
        ("geoduck_raw", "16x16 pixel art Minecraft texture of raw geoduck, massive long siphon beside oval shell, on ice"),
        ("shrimp_spot", "16x16 pixel art Minecraft texture of cooked spot prawns, orange-pink with white stripes, in pile"),
        ("fish_fillet_generic", "16x16 pixel art Minecraft texture of generic white fish fillet, mild white flesh, raw"),
        ("roe_salmon", "16x16 pixel art Minecraft texture of salmon roe ikura, bright orange translucent spheres, in bowl"),
        ("roe_herring", "16x16 pixel art Minecraft texture of herring sac-roe skein, golden-yellow, on kelp mat"),
        ("herring_pickled", "16x16 pixel art Minecraft texture of pickled herring, silver fish in glass jar with onion rings"),
        ("clam_chowder", "16x16 pixel art Minecraft texture of bowl of clam chowder, creamy white soup with potato chunks, bread bowl"),
        ("fish_tacos", "16x16 pixel art Minecraft texture of Baja-style fish tacos, grilled fish in tortillas, lime, cabbage"),
        ("bait_herring", "16x16 pixel art Minecraft texture of cut bait herring for fishing, silver fish pieces in bucket"),
        ("ice_block", "16x16 pixel art Minecraft texture of block of fishing ice, translucent blue-white, cold looking"),
        ("fuel_drum", "16x16 pixel art Minecraft texture of red diesel fuel drum, rusty metal, dock scene"),
        ("rope_coil", "16x16 pixel art Minecraft texture of coiled nylon rope, yellow and black, on dock"),
        ("buoy_red", "16x16 pixel art Minecraft texture of red navigation buoy, spherical, with light on top, in water"),
        ("buoy_crab", "16x16 pixel art Minecraft texture of crab pot buoy, yellow foam cylinder with flag, floating in water"),
        ("net_mesh", "16x16 pixel art Minecraft texture of fishing net mesh, green nylon, diamond pattern, translucent"),
        ("dock_planks_old", "16x16 pixel art Minecraft texture of weathered old wooden dock, gray boards with gaps and barnacles"),
        ("metal_hull", "16x16 pixel art Minecraft texture of steel fishing boat hull, dark blue paint with rust streaks"),
        ("compass_rose", "16x16 pixel art Minecraft texture of compass rose, NSEW directions, decorative, nautical map style"),
        ("nautical_chart", "16x16 pixel art Minecraft texture of nautical chart section, blue water, depth numbers, coastlines"),
        ("anchor", "16x16 pixel art Minecraft item icon of a ship anchor, heavy steel, classic fluke design"),
        ("life_jacket", "16x16 pixel art Minecraft item icon of an orange life jacket PFD, emergency orange"),
    ]
    for name, prompt in blocks:
        gen(prompt, p(r, f"blocks/{name}.jpg"), "fast")

    # --- More gear items ---
    log("\n🎣 MORE GEAR ITEMS (fast)")
    gear = [
        ("rod_spinning", "32x32 pixel art icon of a spinning fishing rod, Minecraft style, medium-action rod with spinning reel"),
        ("rod_fly", "32x32 pixel art icon of a fly fishing rod, Minecraft style, long flexible rod with fly reel, line in air"),
        ("rod_halibut", "32x32 pixel art icon of a heavy halibut fishing rod, Minecraft style, short stiff rod, huge reel"),
        ("rod_trolling", "32x32 pixel art icon of a trolling fishing rod, Minecraft style, bent rod in rod holder, fish on line"),
        ("reel_spinning", "32x32 pixel art icon of a spinning fishing reel, Minecraft style, open face, silver metal, braid visible"),
        ("reel_baitcaster", "32x32 pixel art icon of a baitcasting reel, Minecraft style, round low-profile, level wind"),
        ("reel_fly", "32x32 pixel art icon of a fly fishing reel, Minecraft style, large arbor, clicked and palmed"),
        ("braid_line_spool", "32x32 pixel art icon of spool of braided fishing line, Minecraft style, bright yellow braid on plastic spool"),
        ("mono_line_spool", "32x32 pixel art icon of spool of monofilament line, Minecraft style, clear nylon on spool"),
        ("wire_leader", "32x32 pixel art icon of wire fishing leader with snap swivel, Minecraft style, steel cable leader"),
        ("hoochie_skirt", "32x32 pixel art icon of a hoochie rubber squid lure, Minecraft style, pink-purple rubber skirt with hooks"),
        ("buzz_bomb", "32x32 pixel art icon of a Buzz Bomb metal jig lure, Minecraft style, chrome metal with green tape"),
        ("point_wilson_dart", "32x32 pixel art icon of a Point Wilson Dart metal jig, Minecraft style, chrome with red stripe"),
        ("mooching_rig", "32x32 pixel art icon of a mooching cut-plug herring rig, Minecraft style, rigged herring with hooks"),
        ("flasher_dodger", "32x32 pixel art icon of a salmon flasher attractor, Minecraft style, rotating chrome blade, fluorescent green"),
        ("diver_plate", "32x32 pixel art icon of a diver planing device for trolling, Minecraft style, plastic diving planer in blue"),
        ("sinker_bank", "32x32 pixel art icon of a bank sinker weight, Minecraft style, rounded lead weight with eye"),
        ("jig_head", "32x32 pixel art icon of a lead jig head, Minecraft style, painted lead head with hook, in chartreuse"),
        ("skirted_jig", "32x32 pixel art icon of a bucktail jig, Minecraft style, lead head with deer hair tied on, white and pink"),
        ("spoon_trolling", "32x32 pixel art icon of a trolling spoon lure, Minecraft style, curved metal spoon in silver and blue"),
        ("plug_salmon", "32x32 pixel art icon of a salmon plug lure, Minecraft style, wooden diving plug in fluorescent orange"),
        ("bait_herring_whole", "32x32 pixel art icon of whole herring bait, Minecraft style, silver herring with circle hook through jaw"),
        ("octopus_squid_bait", "32x32 pixel art icon of octopus squid bait, Minecraft style, whole small squid with hook, pink-purple"),
        ("fillet_knife", "32x32 pixel art icon of a fillet knife, Minecraft style, long thin flexible blade, wooden handle"),
        ("dive_knife", "32x32 pixel art icon of a dive knife, Minecraft style, blunt tip, yellow handle, leg strap"),
        ("catch_bag", "32x32 pixel art icon of a mesh dive catch bag, Minecraft style, nylon mesh bag with drawstring, full of shellfish"),
        ("dive_computer", "32x32 pixel art icon of a dive computer wrist device, Minecraft style, digital display showing depth and time"),
        ("regulator", "32x32 pixel art icon of SCUBA regulator, Minecraft style, first stage, hose, second stage mouthpiece"),
        ("slime_bag", "32x32 pixel art icon of a fish slime bag, Minecraft style, wet fabric bag for keeping fish fresh on boat"),
        ("abalone_iron", "32x32 pixel art icon of an abalone iron bar, Minecraft style, flat stainless bar for prying abalone off rocks"),
        ("water_wand", "32x32 pixel art icon of a geoduck water wand, Minecraft style, high-pressure nozzle attached to hose, for digging"),
    ]
    for name, prompt in gear:
        gen(prompt, p(r, f"items/gear/{name}.jpg"), "fast")

    # --- Pro-tier hero art (key scenes) ---
    log("\n🎨 HERO ART — KEY SCENES (pro)")
    hero = [
        ("hero_salmon_run", "Epic Minecraft-style panoramic scene of Alaska salmon run, hundreds of salmon leaping up a misty forest river, waterfalls, eagles circling overhead, bears fishing at falls, golden sunset light filtering through old-growth spruce trees, cinematic wide shot"),
        ("hero_seine_set", "Epic Minecraft-style aerial view of a purse seine fishing operation in Sitka Sound, boat circling school of salmon, net closing, skiff holding one end, Alaska islands in background, dramatic cloudy sky, water splashing"),
        ("hero_bubble_net_feeding", "Epic Minecraft-style underwater scene of humpback whale bubble-net feeding, ring of bubbles trapping school of herring, massive whale mouth open lunging upward through bubble net, sunlight streaming down, other whales around, spectacular"),
        ("hero_king_crab_storm", "Epic Minecraft-style scene of king crab fishing boat in Bering Sea storm, massive 30-foot waves, boat tilted at angle, crew in orange survival suits hauling pot, freezing spray, dramatic lighting, intense"),
        ("hero_sitka_aerial", "Epic Minecraft-style aerial panoramic view of Sitka Alaska, harbor with fishing boats, town along waterfront, Baranof Island mountains, Mount Edgecumbe volcano in distance, overcast moody sky, classic Southeast Alaska"),
        ("hero_deep_drop", "Epic Minecraft-style deep underwater scene showing a halibut longline descending into dark abyss, hooks with herring bait, large halibut approaching, sablefish swimming by, bioluminescence, mysterious deep ocean"),
        ("hero_river_bears", "Epic Minecraft-style scene of Alaskan river during salmon spawn, multiple brown bears fishing at different spots along river, misty rain forest, old-growth trees, spawning salmon visible in clear water"),
    ]
    for name, prompt in hero:
        gen(prompt, p(r, f"hero/{name}.jpg"), "pro")

    # --- Mid-tier NPC portraits ---
    log("\n👤 MORE NPC PORTRAITS (mid)")
    npcs = [
        ("tlingit_fisherman_young", "Minecraft-style portrait of a young Tlingit Alaska Native fisherman, wearing modern rain gear, beaded necklace, on boat deck, confident expression"),
        ("veteran_troller", "Minecraft-style portrait of an elderly Alaska salmon troller, weathered face, gray ponytail, rain jacket, on small boat, decades of experience"),
        ("fish_processor", "Minecraft-style portrait of a worker at Sitka fish processing plant, wearing apron and hairnet, holding fillet knife, fluorescent lighting"),
        ("charter_captain", "Minecraft-style portrait of a young charter boat captain, enthusiastic, baseball cap, polo shirt, standing at helm"),
        ("divemaster", "Minecraft-style portrait of a scuba dive master, wetsuit, mask pushed up, tank on back, standing on rocky shore"),
        ("storekeeper", "Minecraft-style portrait of a Sitka general store owner, middle-aged woman, friendly, standing behind counter with Alaska souvenirs"),
        ("coast_guard", "Minecraft-style portrait of a US Coast Guard member in uniform, standing on cutter deck, Sitka Sound behind"),
        ("adfg_trooper", "Minecraft-style portrait of an Alaska Wildlife Trooper, badge, uniform, on patrol boat, serious expression"),
        ("kid_fisherman", "Minecraft-style portrait of a Sitka kid, maybe 12 years old, holding up a small salmon, huge smile, rubber boots, rain jacket"),
        ("old_timer_dock", "Minecraft-style portrait of an old Alaska fisherman sitting on harbor wall, pipe, wool cap, watching boats, content"),
        ("tlingit_weaver", "Minecraft-style portrait of a Tlingit elder woman weaving a cedar basket, warm light, traditional patterns, wise face"),
        ("helicopter_pilot", "Minecraft-style portrait of an Alaska helicopter pilot, headset, aviator sunglasses, in front of helicopter, rugged"),
        ("cook_boat", "Minecraft-style portrait of a fishing boat cook, in tiny galley, making coffee, pots everywhere, warm despite the weather"),
        ("deckhand_rookie", "Minecraft-style portrait of a young greenhorn deckhand, overwhelmed, holding net, first day on a seiner"),
    ]
    for name, prompt in npcs:
        gen(prompt, p(r, f"npcs/{name}.jpg"), "mid")

    # --- More locations ---
    log("\n🏞️ MORE LOCATIONS (mid)")
    locations = [
        ("dean_lake_helicopter", "Minecraft-style scene of helicopter delivering salmon fry to remote Deer Lake above waterfall, pristine alpine lake surrounded by mountains, misty"),
        ("indian_river_salmon", "Minecraft-style scene of Indian River in Sitka with salmon running, forest trail alongside, boardwalk, salmon visible in clear water"),
        ("blue_lake_reservoir", "Minecraft-style scene of Blue Lake reservoir above Sitka, clear mountain lake, fishing boat, conifer forest, peaceful"),
        ("hidden_lake_wilderness", "Minecraft-style scene of Hidden Lake wilderness area, pristine alpine lake, no structures, total wilderness, moody atmosphere"),
        ("edgecumbe_ring", "Minecraft-style underwater scene around Mount Edgecumbe volcano, volcanic rock bottom, unique deep species, geothermal vents"),
        ("shipwreck_cove", "Minecraft-style underwater scene of sunken fishing boat wreck, coral growing on hull, fish swimming around, mystery"),
        ("hot_springs", "Minecraft-style scene of underwater thermal hot springs, warm water vents, unusual species, steam bubbles, rocky bottom"),
        ("old_cannery_night", "Minecraft-style scene of abandoned salmon cannery at night, moonlight, fog, creaking buildings, ghosts of the past"),
        ("tidal_flat_low_tide", "Minecraft-style scene of Alaska tidal flats at extreme low tide, exposed sand, people digging for geoducks, clams visible"),
        ("crescent_harbor_morning", "Minecraft-style scene of Crescent Harbor Sitka at dawn, fishing boats moored, coffee steam from cups, mountains reflected in still water"),
        ("herring_spawn_bay", "Minecraft-style aerial scene of herring spawn, turquoise water turned white with milt and eggs, masses of birds and sea lions feeding"),
        ("orca_sunset", "Minecraft-style scene of orca pod at sunset, black dorsal fins cutting through golden water, Sitka mountains silhouetted, dramatic"),
    ]
    for name, prompt in locations:
        gen(prompt, p(r, f"locations/{name}.jpg"), "mid")

# ============================================================
# CRAFTMIND STUDIO — Movie/game studio tycoon
# ============================================================
def gen_studio():
    r = "craftmind-studio"
    log("\n" + "=" * 60)
    log("🎬 CRAFTMIND STUDIO — Movie Tycoon Assets")
    log("=" * 60)
    
    log("\n🧱 STUDIO BLOCKS & ITEMS (fast)")
    items = [
        ("movie_camera", "16x16 pixel art Minecraft item icon of a movie film camera on tripod, vintage Hollywood style"),
        ("clapperboard", "16x16 pixel art Minecraft item icon of a film clapperboard slate, black and white stripes, clapper open"),
        ("film_reel", "16x16 pixel art Minecraft item icon of a film reel, round metal reel with film strip wound on it"),
        ("microphone_boom", "16x16 pixel art Minecraft item icon of a boom microphone on pole, fuzzy windscreen"),
        ("spotlight", "16x16 pixel art Minecraft item icon of a studio spotlight, metal housing with bright beam"),
        ("directors_chair", "16x16 pixel art Minecraft item icon of a director's chair, canvas back saying DIRECTOR, wooden frame"),
        ("script_paper", "16x16 pixel art Minecraft item icon of a movie script, paper with typed text, brad fasteners"),
        ("film_canister", "16x16 pixel art Minecraft item icon of a 35mm film canister, silver metal can with label"),
        ("oscar_trophy", "16x16 pixel art Minecraft item icon of an award trophy statue, gold, holding a sword, on marble base"),
        ("box_office", "16x16 pixel art Minecraft texture of movie theater marquee, lit up, showing movie titles and showtimes"),
        ("green_screen", "16x16 pixel art Minecraft texture of a green screen backdrop, bright green fabric on frame"),
        ("red_carpet", "16x16 pixel art Minecraft texture of red carpet with gold rope stanchions, paparazzi event"),
        ("star_walk", "16x16 pixel art Minecraft texture of Hollywood walk of fame star on sidewalk, pink terrazzo with brass star"),
        ("studio_lot", "16x16 pixel art Minecraft texture of movie studio backlot, sound stages, fake building fronts"),
        ("popcorn", "16x16 pixel art Minecraft item icon of movie popcorn in striped tub, buttery, red and white striped"),
        ("editing_timeline", "16x16 pixel art Minecraft texture of video editing timeline, film strips in rows, cut marks"),
    ]
    for name, prompt in items:
        gen(prompt, p(r, f"items/{name}.jpg"), "fast")
    
    log("\n👤 STUDIO NPCs (mid)")
    npcs = [
        ("director_roland", "Minecraft-style portrait of a movie director, beret, megaphone, passionate, on set calling action"),
        ("starlet", "Minecraft-style portrait of a glamorous movie star actress, red carpet pose, elegant dress, Hollywood"),
        ("stunt_double", "Minecraft-style portrait of a stunt person, protective padding visible, determined, ready to jump"),
        ("producer", "Minecraft-style portrait of a movie producer in expensive suit, holding phone, stressed, on lot"),
        ("critic", "Minecraft-style portrait of a snobby movie critic, glasses, notebook, unimpressed expression, writing review"),
        ("sound_engineer", "Minecraft-style portrait of a sound engineer in studio, headphones, mixing board, focused"),
        ("set_designer", "Minecraft-style portrait of a set designer, paint-stained clothes, holding blueprints, creative"),
        ("caterer", "Minecraft-style portrait of a film set caterer, chef hat, serving food to crew between takes"),
        ("paparazzi", "Minecraft-style portrait of a paparazzi photographer, camera raised, flash going off, eager"),
        ("fan_girl", "Minecraft-style portrait of an excited movie fan girl, holding poster, starstruck, at premiere"),
    ]
    for name, prompt in npcs:
        gen(prompt, p(r, f"npcs/{name}.jpg"), "mid")
    
    log("\n🎬 STUDIO SCENES (pro)")
    scenes = [
        ("hero_film_set", "Epic Minecraft-style scene of a movie film set in action, cameras rolling, director calling through megaphone, lights blazing, crew working, actors on stylized medieval set, crane shot overhead, cinematic"),
        ("hero_red_carpet_premiere", "Epic Minecraft-style scene of movie premiere red carpet event, paparazzi flashing, fans screaming, limousines, stars arriving, marquee lit up behind, glamorous nighttime"),
        ("hero_sound_stage", "Epic Minecraft-style interior of a massive film sound stage, green screens, cameras on dollies, lighting rigs overhead, crew bustling, director's monitor showing the scene being filmed"),
    ]
    for name, prompt in scenes:
        gen(prompt, p(r, f"hero/{name}.jpg"), "pro")

# ============================================================
# CRAFTMIND COURSES — AI teaching
# ============================================================
def gen_courses():
    r = "craftmind-courses"
    log("\n" + "=" * 60)
    log("📚 CRAFTMIND COURSES — Education Assets")
    log("=" * 60)
    
    log("\n🧱 COURSE ITEMS (fast)")
    items = [
        ("textbook", "16x16 pixel art Minecraft item icon of a textbook, thick book with cover design"),
        ("graduation_cap", "16x16 pixel art Minecraft item icon of a graduation cap, black mortarboard with tassel"),
        ("report_card", "16x16 pixel art Minecraft item icon of a report card, paper with grades, A+ visible"),
        ("chalkboard", "16x16 pixel art Minecraft texture of a green chalkboard with chalk writing and diagrams"),
        ("desk_student", "16x16 pixel art Minecraft item icon of a student desk with open textbook and pencil"),
        ("apple_teacher", "16x16 pixel art Minecraft item icon of a red apple for teacher, classic symbol"),
        ("diploma", "16x16 pixel art Minecraft item icon of a diploma certificate, rolled up with ribbon"),
        ("quiz_paper", "16x16 pixel art Minecraft item icon of a quiz test paper with multiple choice questions"),
        ("flashcard", "16x16 pixel art Minecraft item icon of a flashcard, showing question on one side"),
        ("skill_badge", "16x16 pixel art Minecraft item icon of a skill achievement badge, star-shaped medal"),
        ("redstone_lesson", "16x16 pixel art Minecraft texture of a redstone circuit educational display, torches, repeaters labeled"),
        ("building_lesson", "16x16 pixel art Minecraft texture of a building tutorial display, block-by-block construction guide"),
    ]
    for name, prompt in items:
        gen(prompt, p(r, f"items/{name}.jpg"), "fast")
    
    log("\n👤 COURSE NPCs (mid)")
    npcs = [
        ("professor_redstone", "Minecraft-style portrait of a redstone engineering professor, redstone-stained fingers, goggles, enthusiastic, holding a circuit diagram"),
        ("teacher_building", "Minecraft-style portrait of a Minecraft building instructor, architect apron, blueprints, patient expression, pointing at a structure"),
        ("survival_instructor", "Minecraft-style portrait of a wilderness survival teacher, leather armor, compass, knife, rugged, standing in forest"),
        ("student_excited", "Minecraft-style portrait of an excited young student, raising hand, lightbulb moment, classroom"),
        ("student_struggling", "Minecraft-style portrait of a frustrated student scratching head, confused by complex redstone circuit"),
        ("classmate_helper", "Minecraft-style portrait of a helpful classmate student, friendly, pointing at book, tutoring another student"),
    ]
    for name, prompt in npcs:
        gen(prompt, p(r, f"npcs/{name}.jpg"), "mid")
    
    log("\n🏫 CLASSROOM SCENES (pro)")
    scenes = [
        ("hero_classroom", "Epic Minecraft-style scene of a Minecraft classroom with students at desks, teacher at chalkboard with redstone diagrams, library shelves in back, warm lighting, educational atmosphere"),
    ]
    for name, prompt in scenes:
        gen(prompt, p(r, f"hero/{name}.jpg"), "pro")

# ============================================================
# CRAFTMIND HERDING — Sheep/dog herding
# ============================================================
def gen_herding():
    r = "craftmind-herding"
    log("\n" + "=" * 60)
    log("🐕 CRAFTMIND HERDING — Herding Dog Assets")
    log("=" * 60)
    
    log("\n🐕 DOG & ANIMAL SPRITES (fast)")
    sprites = [
        ("border_collie", "16x16 pixel art Minecraft sprite of a Border Collie herding dog, black and white, athletic, alert, crouching"),
        ("border_collie_lie", "16x16 pixel art Minecraft sprite of a Border Collie lying down watching sheep, resting between commands"),
        ("australian_shepherd", "16x16 pixel art Minecraft sprite of an Australian Shepherd dog, merle coat, blue eyes, agile"),
        ("sheep_white", "16x16 pixel art Minecraft sprite of a white fluffy sheep, grazing, peaceful, woolly"),
        ("sheep_lamb", "16x16 pixel art Minecraft sprite of a baby lamb, small, white fluffy, playful, spring"),
        ("goat", "16x16 pixel art Minecraft sprite of a goat, brown and white, standing on rocky terrain, curious"),
        ("cow", "16x16 pixel art Minecraft sprite of a dairy cow, black and white spotted, grazing"),
        ("horse", "16x16 pixel art Minecraft sprite of a horse, brown, grazing in green meadow"),
        ("chicken", "16x16 pixel art Minecraft sprite of a chicken, white, pecking at ground"),
        ("rooster", "16x16 pixel art Minecraft sprite of a rooster, red comb, crowing, colorful feathers"),
        ("fox", "16x16 pixel art Minecraft sprite of a red fox, sneaky, near sheep pen, predator threat"),
        ("wolf", "16x16 pixel art Minecraft sprite of a gray wolf, pack animal, howling, threat to livestock"),
        ("eagle_fly", "16x16 pixel art Minecraft sprite of a Golden Eagle flying, predator of small livestock, wings spread"),
    ]
    for name, prompt in sprites:
        gen(prompt, p(r, f"species/{name}.jpg"), "fast")
    
    log("\n🧱 HERDING ITEMS (fast)")
    items = [
        ("shearing_shears", "16x16 pixel art Minecraft item icon of shearing shears for sheep wool, metal blades"),
        ("herding_crook", "16x16 pixel art Minecraft item icon of a shepherd's crook, wooden staff with curved hook"),
        ("dog_whistle", "16x16 pixel art Minecraft item icon of a dog training whistle, small metal whistle on lanyard"),
        ("wool_bundle", "16x16 pixel art Minecraft item icon of a bundle of raw sheep wool, fluffy white pile"),
        ("fence_gate", "16x16 pixel art Minecraft texture of a wooden farm fence gate, weathered, livestock pen"),
        ("barn", "16x16 pixel art Minecraft texture of a red wooden barn, classic farm building, doors open"),
        ("hay_bale", "16x16 pixel art Minecraft item icon of a golden hay bale, tied with twine"),
        ("feed_trough", "16x16 pixel art Minecraft item icon of a wooden animal feed trough, with grain inside"),
        ("dog_treat", "16x16 pixel art Minecraft item icon of a dog training treat, bone-shaped biscuit"),
        ("herding_course", "16x16 pixel art Minecraft item icon of a herding course map, showing obstacles and path"),
        ("training_flag", "16x16 pixel art Minecraft item icon of a training flag marker, colored pennant on pole"),
        ("livestock_market", "16x16 pixel art Minecraft texture of a livestock market auction ring, pens, buyers seated"),
    ]
    for name, prompt in items:
        gen(prompt, p(r, f"items/{name}.jpg"), "fast")
    
    log("\n👤 HERDING NPCs (mid)")
    npcs = [
        ("shepherd_old", "Minecraft-style portrait of an old shepherd, weathered face, wool sweater, crook in hand, surrounded by sheep on a green hillside, content"),
        ("dog_trainer", "Minecraft-style portrait of a professional dog trainer, whistle around neck, two border collies at feet, on training field"),
        ("rancher", "Minecraft-style portrait of a young cattle rancher, cowboy hat, boots, on horseback, open range behind"),
        ("vet_animal", "Minecraft-style portrait of a large animal veterinarian, coveralls, stethoscope, examining a sheep"),
        ("judge_trial", "Minecraft-style portrait of a herding trial judge, clipboard, watching dogs work sheep, focused"),
    ]
    for name, prompt in npcs:
        gen(prompt, p(r, f"npcs/{name}.jpg"), "mid")
    
    log("\n🐕 HERDING HERO (pro)")
    gen("Epic Minecraft-style panoramic scene of a herding trial competition, Border Collie expertly moving sheep through obstacles on a green hillside, shepherd giving commands in distance, mountains and blue sky, autumn light, pastoral and dramatic",
       p(r, "hero/hero_herding_trial.jpg"), "pro")

# ============================================================
# CRAFTMIND CIRCUITS — Redstone puzzles
# ============================================================
def gen_circuits():
    r = "craftmind-circuits"
    log("\n" + "=" * 60)
    log("⚡ CRAFTMIND CIRCUITS — Redstone Assets")
    log("=" * 60)
    
    log("\n⚡ REDSTONE BLOCKS (fast)")
    items = [
        ("redstone_dust", "16x16 pixel art Minecraft texture of redstone dust trail on stone, glowing red lines connecting components"),
        ("redstone_torch_on", "16x16 pixel art Minecraft item icon of a redstone torch, lit, glowing red on stick"),
        ("redstone_torch_off", "16x16 pixel art Minecraft item icon of a redstone torch, unlit, dark"),
        ("repeater", "16x16 pixel art Minecraft item icon of a redstone repeater, two torches on stone slab, with delay ticks"),
        ("comparator", "16x16 pixel art Minecraft item icon of a redstone comparator, three torches, front and back modes"),
        ("piston_extended", "16x16 pixel art Minecraft texture of a piston extended, pushing a block outward, mechanical"),
        ("piston_retracted", "16x16 pixel art Minecraft texture of a piston retracted, compact, stone face with wooden arm inside"),
        ("observer", "16x16 pixel art Minecraft item icon of a redstone observer block, face detecting, face and back"),
        ("dispenser", "16x16 pixel art Minecraft item icon of a dispenser block, crossbow-like face, arrows visible inside slots"),
        ("hopper", "16x16 pixel art Minecraft item icon of a hopper, inverted funnel shape, iron, collecting items"),
        ("note_block", "16x16 pixel art Minecraft item icon of a note block, wooden block with music note symbol on front"),
        ("jukebox", "16x16 pixel art Minecraft item icon of a jukebox, wooden block with music disc slot, golden music notes"),
        ("lamp_redstone", "16x16 pixel art Minecraft texture of a redstone lamp, glowing bright when powered, dark stone with red lines"),
        ("door_redstone", "16x16 pixel art Minecraft texture of an iron door activated by redstone, slightly open"),
        ("button_stone", "16x16 pixel art Minecraft texture of a stone button on block face, clickable, small rounded"),
        ("lever", "16x16 pixel art Minecraft texture of a lever on block, metal switch, can be on or off position"),
        ("pressure_plate", "16x16 pixel art Minecraft texture of a wooden pressure plate on blocks, thin plank"),
        ("daylight_sensor", "16x16 pixel art Minecraft item icon of a daylight sensor, glass and wood, detecting sun"),
        ("tnt_block", "16x16 pixel art Minecraft texture of TNT block, red and white striped, dangerous, fuse"),
        ("command_block", "16x16 pixel art Minecraft texture of a command block, green, programming interface, powerful"),
        ("circuit_blueprint", "16x16 pixel art Minecraft item icon of a circuit blueprint schematic, showing redstone connections on paper"),
    ]
    for name, prompt in items:
        gen(prompt, p(r, f"blocks/{name}.jpg"), "fast")
    
    log("\n👤 CIRCUITS NPC (mid)")
    gen("Minecraft-style portrait of a redstone engineer tutor, redstone-stained fingers, goggles with magnifying lenses, multiple circuits visible behind them on pegboard, enthusiastic teacher expression",
       p(r, "npcs/redstone_professor.jpg"), "mid")
    
    log("\n⚡ CIRCUITS HERO (pro)")
    gen("Epic Minecraft-style scene of an elaborate redstone circuit academy, massive wall of working redstone contraptions, automated doors, piston elevators, music machines, glowing red lines everywhere, students learning, steampunk-inspired architecture",
       p(r, "hero/hero_circuit_academy.jpg"), "pro")

# ============================================================
# CRAFTMIND RANCH — Animal breeding
# ============================================================
def gen_ranch():
    r = "craftmind-ranch"
    log("\n" + "=" * 60)
    log("🐄 CRAFTMIND RANCH — Animal Breeding Assets")
    log("=" * 60)
    
    log("\n🐄 RANCH ANIMAL SPRITES (fast)")
    sprites = [
        ("pig", "16x16 pixel art Minecraft sprite of a pink pig, round, curly tail, cute"),
        ("cow_brown", "16x16 pixel art Minecraft sprite of a brown cow, different breed, gentle"),
        ("chicken_brown", "16x16 pixel art Minecraft sprite of a brown chicken, Rhode Island Red"),
        ("rabbit", "16x16 pixel art Minecraft sprite of a rabbit, white with pink eyes, fluffy"),
        ("donkey", "16x16 pixel art Minecraft sprite of a gray donkey, ears up, friendly"),
        ("llama", "16x16 pixel art Minecraft sprite of a llama, white and brown, spitting, funny"),
        ("parrot", "16x16 pixel art Minecraft sprite of a colorful parrot, red and blue, on perch"),
        ("bee", "16x16 pixel art Minecraft sprite of a bee, yellow and black stripes, fuzzy, carrying pollen"),
        ("fox_red", "16x16 pixel art Minecraft sprite of a red fox, sitting, bushy tail, cunning"),
        ("turtle", "16x16 pixel art Minecraft sprite of a sea turtle, green shell, swimming, flippers"),
        ("frog", "16x16 pixel art Minecraft sprite of a frog, bright green, sitting on lily pad"),
        ("axolotl", "16x16 pixel art Minecraft sprite of an axolotl, pink, external gills, cute, underwater"),
        ("sniffer", "16x16 pixel art Minecraft sprite of a Sniffer, ancient creature, large round body, plant sniffer"),
        ("armadillo", "16x16 pixel art Minecraft sprite of an armadillo, curled up in armored ball, scaly plates"),
    ]
    for name, prompt in sprites:
        gen(prompt, p(r, f"species/{name}.jpg"), "fast")
    
    log("\n🧱 RANCH ITEMS (fast)")
    items = [
        ("dna_strand", "16x16 pixel art Minecraft item icon of a DNA double helix strand, colorful, scientific"),
        ("breeding_chart", "16x16 pixel art Minecraft item icon of a breeding pedigree chart, family tree diagram"),
        ("incubator", "16x16 pixel art Minecraft item icon of an egg incubator, warm, eggs inside, temperature gauge"),
        ("feed_auto", "16x16 pixel art Minecraft item icon of an automatic animal feeder, metal hopper dispensing grain"),
        ("water_trough", "16x16 pixel art Minecraft item icon of a water trough for animals, metal, full of water"),
        ("weigh_scale", "16x16 pixel art Minecraft item icon of a livestock scale, measuring weight of animal"),
        ("health_potion", "16x16 pixel art Minecraft item icon of an animal health potion bottle, red liquid, veterinary"),
        ("record_book", "16x16 pixel art Minecraft item icon of a ranch record book, leather cover, breeding records inside"),
        ("fence_rail", "16x16 pixel art Minecraft texture of a wooden ranch fence rail, split rail, rustic"),
        ("pasture_gate", "16x16 pixel art Minecraft texture of a ranch pasture gate, wooden, swinging open to green field"),
        ("silo_grain", "16x16 pixel art Minecraft texture of a tall grain silo, metal, cylindrical, farm scene"),
        ("barn_red", "16x16 pixel art Minecraft texture of a classic red barn, X on door, weather vane on roof"),
    ]
    for name, prompt in items:
        gen(prompt, p(r, f"items/{name}.jpg"), "fast")
    
    log("\n👤 RANCH NPC (mid)")
    gen("Minecraft-style portrait of a passionate animal breeder and rancher, wearing overalls and straw hat, surrounded by various farm animals, bottle-feeding a baby lamb, warm smile, farm behind",
       p(r, "npcs/rancher.jpg"), "mid")
    
    log("\n🐄 RANCH HERO (pro)")
    gen("Epic Minecraft-style panoramic scene of a thriving animal ranch, rolling green pastures with various animals grazing, red barn, silo, DNA breeding lab visible in modern building, baby animals with parents, sunset golden light, peaceful and productive farm life",
       p(r, "hero/hero_ranch.jpg"), "pro")

# ============================================================
# CRAFTMIND RESEARCHER — Science experiments
# ============================================================
def gen_researcher():
    r = "craftmind-researcher"
    log("\n" + "=" * 60)
    log("🔬 CRAFTMIND RESEARCHER — Science Assets")
    log("=" * 60)
    
    log("\n🔬 RESEARCH ITEMS (fast)")
    items = [
        ("microscope", "16x16 pixel art Minecraft item icon of a microscope, brass and steel, scientific"),
        ("beaker", "16x16 pixel art Minecraft item icon of a glass beaker with colorful liquid, bubbling"),
        ("petri_dish", "16x16 pixel art Minecraft item icon of a petri dish with culture growing, bacterial colonies"),
        ("notebook_lab", "16x16 pixel art Minecraft item icon of a laboratory notebook, leather, handwritten formulas"),
        ("graph_chart", "16x16 pixel art Minecraft item icon of a scientific graph chart, line graph with data points"),
        ("magnifying_glass", "16x16 pixel art Minecraft item icon of a magnifying glass, examining something, detective"),
        ("evidence_bag", "16x16 pixel art Minecraft item icon of an evidence bag with specimen, labeled, sealed"),
        ("citation_paper", "16x16 pixel art Minecraft item icon of a research paper citation, academic journal"),
        ("experiment_rig", "16x16 pixel art Minecraft texture of a science experiment apparatus, beakers connected, bubbling"),
        ("lab_bench", "16x16 pixel art Minecraft texture of a laboratory bench, equipment, bottles, organized clutter"),
        ("data_terminal", "16x16 pixel art Minecraft texture of a research data terminal, screen showing analysis"),
        ("knowledge_tree", "16x16 pixel art Minecraft texture of a knowledge tree visualization, branching connections, glowing nodes"),
    ]
    for name, prompt in items:
        gen(prompt, p(r, f"items/{name}.jpg"), "fast")
    
    log("\n👤 RESEARCHER NPCs (mid)")
    npcs = [
        ("scientist_lead", "Minecraft-style portrait of a lead research scientist, lab coat, glasses, clipboard, excited about discovery"),
        ("research_assistant", "Minecraft-style portrait of a young research assistant, learning, holding samples, eager"),
        ("peer_reviewer", "Minecraft-style portrait of a peer reviewer, critical expression, reading papers, academic"),
        ("lab_manager", "Minecraft-style portrait of a laboratory manager, organized, budgets, schedules, keeping things running"),
    ]
    for name, prompt in npcs:
        gen(prompt, p(r, f"npcs/{name}.jpg"), "mid")
    
    log("\n🔬 RESEARCHER HERO (pro)")
    gen("Epic Minecraft-style scene of a science research laboratory, multiple experiment stations running, data visualization on screens, scientists collaborating, discovery moment, glowing results on monitor, beakers bubbling, charts on walls, modern lab with Minecraft aesthetic",
       p(r, "hero/hero_lab.jpg"), "pro")

# ============================================================
# MAIN
# ============================================================
def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    start = time.time()
    log("Warming up API (90s)...")
    time.sleep(90)
    
    if target in ("all", "fishing"):
        gen_fishing()
    if target in ("all", "studio"):
        gen_studio()
    if target in ("all", "courses"):
        gen_courses()
    if target in ("all", "herding"):
        gen_herding()
    if target in ("all", "circuits"):
        gen_circuits()
    if target in ("all", "ranch"):
        gen_ranch()
    if target in ("all", "researcher"):
        gen_researcher()
    
    elapsed = time.time() - start
    
    log("\n" + "=" * 60)
    log(f"DONE in {elapsed/60:.1f} minutes")
    log(f"  Fast (Imagen):  {stats['fast']} generated")
    log(f"  Mid (Nano Banana):  {stats['mid']} generated")
    log(f"  Pro (Nano Banana Pro): {stats['pro']} generated")
    log(f"  Skipped (exists): {stats['skipped']}")
    log(f"  Errors: {stats['errors']}")
    log(f"  Total: {stats['fast']+stats['mid']+stats['pro']+stats['skipped']+stats['errors']}")
    log("=" * 60)

if __name__ == "__main__":
    main()
