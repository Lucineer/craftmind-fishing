#!/usr/bin/env python3
"""Gemini-only batch generator with aggressive rate limiting for free tier."""
import json,sys,os,base64,time,urllib.request

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("ERROR: Set GEMINI_API_KEY env var")
    sys.exit(1)
DELAY = 15  # seconds between requests
BACKOFF = 120

stats = {"ok": 0, "skip": 0, "err": 0}

def gen(prompt, filepath, model="gemini-2.5-flash-image"):
    if os.path.exists(filepath):
        stats["skip"] += 1; return
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
    payload = {"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"responseModalities":["TEXT","IMAGE"]}}
    for attempt in range(3):
        try:
            data = json.dumps(payload).encode()
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=90) as resp:
                result = json.loads(resp.read())
            for p in result.get("candidates",[{}])[0].get("content",{}).get("parts",[]):
                if "inlineData" in p:
                    d = p["inlineData"]
                    ext = "png" if "png" in d.get("mimeType","") else "jpg"
                    actual = filepath if filepath.endswith(ext) else filepath.rsplit(".",1)[0]+f".{ext}"
                    with open(actual,"wb") as f: f.write(base64.b64decode(d["data"]))
                    stats["ok"] += 1
                    print(f"  OK: {os.path.basename(actual)}", flush=True)
                    time.sleep(DELAY)
                    return
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = BACKOFF * (attempt + 1)
                print(f"  429 wait {wait}s (attempt {attempt+1}/3): {os.path.basename(filepath)}", flush=True)
                time.sleep(wait)
                continue
            print(f"  ERR {e.code}: {os.path.basename(filepath)}", flush=True)
            stats["err"] += 1; return
        except Exception as e:
            print(f"  ERR: {os.path.basename(filepath)} - {str(e)[:60]}", flush=True)
            stats["err"] += 1; return
    stats["err"] += 1

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    print(f"Starting {target} generation (Gemini-only, {DELAY}s delay)...", flush=True)
    
    P = lambda r,s: os.path.join(r, "assets", "generated", s)
    REPO = "craftmind-fishing"
    FR = "/home/lucineer/projects/craftmind-fishing"

    if target in ("all", "fishing"):
        print("\n🐟 FISHING — Creative extras", flush=True)
        extras = [
            # More fish species variants
            (f"{FR}/{P(REPO,'species/fish/pink_salmon_male.jpg')}","16x16 pixel art Minecraft sprite of male Pink Humpy salmon with large humped back and hooked jaw, spawning colors, olive green with dark spots"),
            (f"{FR}/{P(REPO,'species/fish/chum_spawning.jpg')}","16x16 pixel art Minecraft sprite of Chum salmon in spawning colors, dramatic purple and green tiger stripes, ferocious looking"),
            (f"{FR}/{P(REPO,'species/fish/sockeye_spawning.jpg')}","16x16 pixel art Minecraft sprite of Sockeye salmon in bright red spawning colors, green head, hook jaw, river background"),
            (f"{FR}/{P(REPO,'species/fish/king_saltwater.jpg')}","16x16 pixel art Minecraft sprite of bright silver ocean-phase King Chinook salmon, blue-green back, spotted tail, powerful"),
            # Shellfish detail
            (f"{FR}/{P(REPO,'species/invertebrates/barnacle.jpg')}","16x16 pixel art Minecraft sprite of acorn barnacles on rock, white cone-shaped shells, intertidal zone"),
            (f"{FR}/{P(REPO,'species/invertebrates/starfish_sunflower.jpg')}","16x16 pixel art Minecraft sprite of Sunflower Starfish with 24 arms, orange-red, massive, underwater"),
            (f"{FR}/{P(REPO,'species/invertebrates/nudibranch.jpg')}","16x16 pixel art Minecraft sprite of a colorful nudibranch sea slug, bright orange with white frills, underwater Alaska"),
            (f"{FR}/{P(REPO,'species/invertebrates/sea_urchin_red.jpg')}","16x16 pixel art Minecraft sprite of Red Sea Urchin, round purple-black ball covered in long sharp red spines"),
            (f"{FR}/{P(REPO,'species/invertebrates/jellyfish_moon.jpg')}","16x16 pixel art Minecraft sprite of Moon Jellyfish, translucent white dome with four purple horseshoe shapes, underwater"),
            (f"{FR}/{P(REPO,'species/invertebrates/anemone.jpg')}","16x16 pixel art Minecraft sprite of Giant Green Anemone, bright green tentacles, pink center, rocky tide pool"),
            # Food/cooking
            (f"{FR}/{P(REPO,'blocks/smoked_halibut.jpg')}","16x16 pixel art Minecraft texture of smoked halibut fillet, golden brown, flaky, on cedar plank"),
            (f"{FR}/{P(REPO,'blocks/grilled_salmon.jpg')}","16x16 pixel art Minecraft texture of grilled salmon fillet with grill marks, pink center, charred edges"),
            (f"{FR}/{P(REPO,'blocks/fish_chips.jpg')}","16x16 pixel art Minecraft texture of fish and chips, battered halibut pieces with golden french fries"),
            (f"{FR}/{P(REPO,'blocks/sushi_salmon.jpg')}","16x16 pixel art Minecraft texture of salmon sushi nigiri, rice block with orange salmon slice, wasabi"),
            (f"{FR}/{P(REPO,'blocks/crab_legs_cooked.jpg')}","16x16 pixel art Minecraft texture of cooked crab legs, bright red shell, white meat exposed, on plate"),
            (f"{FR}/{P(REPO,'blocks/crab_butter.jpg')}","16x16 pixel art Minecraft texture of cracked crab with melted butter dip, elegant, restaurant style"),
            (f"{FR}/{P(REPO,'blocks/oysters_raw.jpg')}","16x16 pixel art Minecraft texture of raw oysters on half shell, glistening, on ice with lemon"),
            (f"{FR}/{P(REPO,'blocks/fish_stew.jpg')}","16x16 pixel art Minecraft texture of hearty Alaskan fish stew, white broth with salmon, potatoes, celery"),
            (f"{FR}/{P(REPO,'blocks/berry_pie.jpg')}","16x16 pixel art Minecraft texture of wild berry pie, purple blueberry filling, lattice crust, rustic"),
            # Boats/vehicles
            (f"{FR}/{P(REPO,'blocks/skiff_aluminum.jpg')}","16x16 pixel art Minecraft sprite of 14ft aluminum skiff, small outboard motor, fishing rods, Sitka harbor"),
            (f"{FR}/{P(REPO,'blocks/charter_boat.jpg')}","16x16 pixel art Minecraft sprite of 28ft fishing charter boat, white hull, tuna tower, professional"),
            (f"{FR}/{P(REPO,'blocks/seiner_boat.jpg')}","16x16 pixel art Minecraft sprite of 58ft purse seiner, power block, net reel, working boat"),
            (f"{FR}/{P(REPO,'blocks/longliner.jpg')}","16x16 pixel art Minecraft sprite of 42ft longline boat, hydraulic hooker, clean deck, halibut gear"),
            (f"{FR}/{P(REPO,'blocks/crabber_big.jpg')}","16x16 pixel art Minecraft sprite of 107ft crab boat, massive steel hull, cranes, pots stacked, Bering Sea"),
            (f"{FR}/{P(REPO,'blocks/dive_tender.jpg')}","16x16 pixel art Minecraft sprite of 24ft dive tender, aluminum, dive ladder, tanks on deck"),
            (f"{FR}/{P(REPO,'blocks/troller_boat.jpg')}","16x16 pixel art Minecraft sprite of 50ft salmon troller, trolling poles extended, gear trailing"),
            (f"{FR}/{P(REPO,'blocks/kayak.jpg')}","16x16 pixel art Minecraft sprite of sea kayak, green fiberglass, paddling in Sitka Sound, mountains"),
            (f"{FR}/{P(REPO,'blocks/helicopter.jpg')}","16x16 pixel art Minecraft sprite of helicopter delivering salmon fry to mountain lake, hovering above water"),
            # Gear detail items
            (f"{FR}/{P(REPO,'items/gear/depth_sounder.jpg')}","32x32 pixel art icon of handheld depth sounder, casting sonar, screen showing bottom"),
            (f"{FR}/{P(REPO,'items/gear/raft_pfd.jpg')}","32x32 pixel art icon of inflatable raft and PFD life jacket, safety gear"),
            (f"{FR}/{P(REPO,'items/gear/gps_handheld.jpg')}","32x32 pixel art icon of handheld GPS unit, screen showing waypoints and track"),
            (f"{FR}/{P(REPO,'items/gear/tide_book.jpg')}","32x32 pixel art icon of tide book booklet, cover showing tide chart for Sitka"),
            (f"{FR}/{P(REPO,'items/gear/whistle_storm.jpg')}","32x32 pixel art icon of storm safety whistle, orange, loud, survival gear"),
            (f"{FR}/{P(REPO,'items/gear/spotlight_boat.jpg')}","32x32 pixel art icon of marine spotlight, powerful beam, mounted on boat cabin"),
            (f"{FR}/{P(REPO,'items/gear/crab_measure.jpg')}","32x32 pixel art icon of crab caliper measuring tool, aluminum, showing size markings"),
            (f"{FR}/{P(REPO,'items/gear/fish_ruler.jpg')}","32x32 pixel art icon of fish measuring ruler board, embossed measurements, mounted on boat"),
            (f"{FR}/{P(REPO,'items/gear/bait_jar.jpg')}","32x32 pixel art icon of glass bait jar with herring pieces preserved in brine"),
            (f"{FR}/{P(REPO,'items/gear/chum_bag.jpg')}","32x32 pixel art icon of chum bag, mesh bag with fish bits, tied to boat for scent trail"),
            # Quest items
            (f"{FR}/{P(REPO,'items/quests/old_map.jpg')}","32x32 pixel art icon of weathered treasure map showing X marks fishing spots, old parchment"),
            (f"{FR}/{P(REPO,'items/quests/tlingit_artifact.jpg')}","32x32 pixel art icon of carved Tlingit artifact, totemic design, cedar wood, ancient"),
            (f"{FR}/{P(REPO,'items/quests/fish_photo_trophy.jpg')}","32x32 pixel art icon of old black and white photo of man with 400lb halibut, vintage"),
            (f"{FR}/{P(REPO,'items/quests/sea_chest.jpg')}","32x32 pixel art icon of old wooden sea chest, brass fittings, contains secrets"),
            (f"{FR}/{P(REPO,'items/quests/lighthouse_key.jpg')}","32x32 pixel art icon of ornate brass lighthouse key, antique, magical glow"),
            # Currency/shop
            (f"{FR}/{P(REPO,'items/currency/gold_coin.jpg')}","32x32 pixel art icon of gold coin, embossed with fish design, game currency"),
            (f"{FR}/{P(REPO,'items/currency/silver_coin.jpg')}","32x32 pixel art icon of silver coin, embossed with anchor design"),
            (f"{FR}/{P(REPO,'items/currency/fish_token.jpg')}","32x32 pixel art icon of wooden fish token, carved, used as trade currency"),
            (f"{FR}/{P(REPO,'items/currency/permit_document.jpg')}","32x32 pixel art icon of official fishing permit document, government seal, stamped"),
            # Achievement badges
            (f"{FR}/{P(REPO,'items/badges/badge_first_catch.jpg')}","32x32 pixel art icon of First Catch achievement badge, simple hook icon, bronze"),
            (f"{FR}/{P(REPO,'items/badges/badge_100_halibut.jpg')}","32x32 pixel art icon of Halibut Hunter badge, halibut silhouette, gold"),
            (f"{FR}/{P(REPO,'items/badges/badge_lingcod_lord.jpg')}","32x32 pixel art icon of Lingcod Lord badge, toothy fish, silver"),
            (f"{FR}/{P(REPO,'items/badges/badge_all_salmon.jpg')}","32x32 pixel art icon of Salmon Grand Slam badge, five salmon species, platinum"),
            (f"{FR}/{P(REPO,'items/badges/badge_crab_king.jpg')}","32x32 pixel art icon of Crab King badge, king crab silhouette, gold"),
            (f"{FR}/{P(REPO,'items/badges/badge_blue_whale.jpg')}","32x32 pixel art icon of Leviathan badge, blue whale, ultra-rare legendary glow"),
        ]
        for filepath, prompt in extras:
            gen(prompt, filepath)

    if target in ("all", "fishing-npcs"):
        print("\n👤 FISHING — More NPCs", flush=True)
        npcs = [
            (f"{FR}/{P(REPO,'npcs/cook_at_erines.jpg')}","Minecraft-style portrait of Ernie's bar cook, big guy, apron, making clam chowder, kitchen background"),
            (f"{FR}/{P(REPO,'npcs/fisherman_regular.jpg')}","Minecraft-style portrait of a regular Sitka fisherman at Ernie's bar, rain gear still on, drinking coffee, morning"),
            (f"{FR}/{P(REPO,'npcs/tourist_family.jpg')}","Minecraft-style portrait of tourist family from cruise ship, mismatched rain gear, excited, lost"),
            (f"{FR}/{P(REPO,'npcs/elder_tlingit_woman.jpg')}","Minecraft-style portrait of Tlingit elder woman, button blanket, shell earrings, wise and warm, weaving cedar bark"),
            (f"{FR}/{P(REPO,'npcs/coast_guard_rescuer.jpg')}","Minecraft-style portrait of Coast Guard rescue swimmer, orange dry suit, helicopter behind, heroic"),
            (f"{FR}/{P(REPO,'npcs/young_fisher_girl.jpg')}","Minecraft-style portrait of a 10-year-old Sitka girl who loves fishing, rubber boots, holding up Dolly Varden, huge proud smile"),
            (f"{FR}/{P(REPO,'npcs/processor_owner.jpg')}","Minecraft-style portrait of Sitka fish processing plant owner, Greek family, third generation, proud of the business"),
            (f"{FR}/{P(REPO,'npcs/pilot_bush.jpg')}","Minecraft-style portrait of Alaska bush pilot, leather jacket, goggles, de Havilland Beaver behind, adventurous"),
            (f"{FR}/{P(REPO,'npcs/ranger_state.jpg')}","Minecraft-style portrait of Alaska State Parks ranger, uniform, binoculars, at trailhead, helpful"),
            (f"{FR}/{P(REPO,'npcs/meteorologist_noaa.jpg')}","Minecraft-style portrait of NOAA weather meteorologist, standing at weather station, instruments behind, chart in hand"),
        ]
        for filepath, prompt in npcs:
            gen(prompt, filepath)

    if target in ("all", "fishing-locations"):
        print("\n🏞️ FISHING — More Locations", flush=True)
        locs = [
            (f"{FR}/{P(REPO,'locations/peril_strait.jpg')}","Minecraft-style scene of Peril Strait Alaska, narrow rocky channel between islands, fast currents, dramatic"),
            (f"{FR}/{P(REPO,'locations/chatham_strait.jpg')}","Minecraft-style scene of Chatham Strait Alaska, wide deep channel, mountains on both sides, commercial fishing boats"),
            (f"{FR}/{P(REPO,'locations/icy_strait.jpg')}","Minecraft-style scene of Icy Strait Alaska, humpback whales, Point Adolphus, dramatic cloudy sky"),
            (f"{FR}/{P(REPO,'locations/mist_cove_secret.jpg')}","Minecraft-style scene of hidden Mist Cove, sea otter raft, pristine, foggy, magical discovery"),
            (f"{FR}/{P(REPO,'locations/gods_pocket.jpg')}","Minecraft-style scene of legendary God's Pocket fishing area, remote, pristine, trophy fish, golden light"),
            (f"{FR}/{P(REPO,'locations/the_gut_channel.jpg')}","Minecraft-style scene of The Gut narrow channel with extreme tidal currents, whirlpools, dangerous, fishing boat navigating"),
            (f"{FR}/{P(REPO,'locations/whale_watching.jpg')}","Minecraft-style scene of whale watching tour, tourists on boat, humpback breaching, Sitka Sound"),
            (f"{FR}/{P(REPO,'locations/fish_processing_plant.jpg')}","Minecraft-style scene of Sitka fish processing plant, conveyor belts, workers, dock, boats unloading"),
            (f"{FR}/{P(REPO,'locations/tlingit_fish_trap.jpg')}","Minecraft-style scene of ancient Tlingit stone fish trap, V-shaped rock walls in tidal flat, still catching fish after centuries"),
            (f"{FR}/{P(REPO,'locations/volcano_edgecumbe_close.jpg')}","Minecraft-style scene of Mount Edgecumbe volcano up close, volcanic rock, fishing boats circumnavigating, dramatic"),
            (f"{FR}/{P(REPO,'locations/winter_sitka.jpg')}","Minecraft-style scene of Sitka Alaska in winter, snow on mountains, quiet harbor, one fishing boat, short daylight"),
            (f"{FR}/{P(REPO,'locations/bering_sea_storm.jpg')}","Minecraft-style scene of Bering Sea in winter storm, massive waves, ice, crab boat fighting through, epic danger"),
        ]
        for filepath, prompt in locs:
            gen(prompt, filepath)

    # STUDIO extras
    if target in ("all", "studio"):
        print("\n🎬 STUDIO — Creative extras", flush=True)
        SR = "/home/lucineer/projects/craftmind-studio"
        items = [
            (f"{SR}/{P('craftmind-studio','items/camera_lens.jpg')}","16x16 pixel art Minecraft item icon of a camera lens, glass, reflective, movie equipment"),
            (f"{SR}/{P('craftmind-studio','items/soundboard.jpg')}","16x16 pixel art Minecraft item icon of audio mixing soundboard, faders, knobs, recording studio"),
            (f"{SR}/{P('craftmind-studio','items/boom_mic.jpg')}","16x16 pixel art Minecraft item icon of boom microphone on pole, fuzzy windscreen, film set"),
            (f"{SR}/{P('craftmind-studio','items/film_strip.jpg')}","16x16 pixel art Minecraft item icon of film strip frames, 35mm celluloid, sequential images"),
            (f"{SR}/{P('craftmind-studio','items/storyboard.jpg')}","16x16 pixel art Minecraft item icon of storyboard panel, hand-drawn scene sketches in grid"),
            (f"{SR}/{P('craftmind-studio','items/award_statuette.jpg')}","16x16 pixel art Minecraft item icon of golden film award statuette, trophy, prestige"),
            (f"{SR}/{P('craftmind-studio','items/trailer_clue.jpg')}","16x16 pixel art Minecraft item icon of movie trailer announcement poster, dramatic, coming soon"),
            (f"{SR}/{P('craftmind-studio','items/box_office_receipt.jpg')}","16x16 pixel art Minecraft item icon of box office receipt, dollar amounts, ticket sales"),
            (f"{SR}/{P('craftmind-studio','items/breakfast_craft.jpg')}","16x16 pixel art Minecraft item icon of film craft services table, donuts, coffee, fruit, behind scenes"),
            (f"{SR}/{P('craftmind-studio','items/walkie_talkie.jpg')}","16x16 pixel art Minecraft item icon of production walkie-talkie, two-way radio, film crew"),
            (f"{SR}/{P('craftmind-studio','npcs/actor_hero.jpg')}","Minecraft-style portrait of a handsome leading man actor, in costume, confident, on movie set"),
            (f"{SR}/{P('craftmind-studio','npcs/actress_star.jpg')}","Minecraft-style portrait of a glamorous leading lady actress, elegant, on red carpet, radiant"),
            (f"{SR}/{P('craftmind-studio','npcs/villain_actor.jpg')}","Minecraft-style portrait of a character actor who plays villains, actually very nice person, between takes"),
            (f"{SR}/{P('craftmind-studio','npcs/stunt_coordinator.jpg')}","Minecraft-style portrait of stunt coordinator, tough, explaining wire rig setup, safety-first"),
            (f"{SR}/{P('craftmind-studio','npcs/writer_script.jpg')}","Minecraft-style portrait of a screenwriter, coffee, laptop, stressed, rewriting scene at coffee shop"),
            (f"{SR}/{P('craftmind-studio','npcs/composer_music.jpg')}","Minecraft-style portrait of a film music composer at piano, orchestrating score, emotional"),
            (f"{SR}/{P('craftmind-studio','locations/backlot_western.jpg')}","Minecraft-style scene of a Western movie backlot set, false-front buildings, desert, cacti, directors chair"),
            (f"{SR}/{P('craftmind-studio','locations/recording_studio.jpg')}","Minecraft-style scene of a professional recording studio, sound booth, mixing console, musicians"),
            (f"{SR}/{P('craftmind-studio','locations/awards_ceremony.jpg')}","Minecraft-style scene of film awards ceremony, stage, audience, spotlights, golden statuettes"),
            (f"{SR}/{P('craftmind-studio','locations/soundstage_green.jpg')}","Minecraft-style scene inside a soundstage with green screen, crew filming fantasy scene, lights and cameras"),
        ]
        for filepath, prompt in items:
            gen(prompt, filepath)

    # COURSES extras
    if target in ("all", "courses"):
        print("\n📚 COURSES — Creative extras", flush=True)
        CR = "/home/lucineer/projects/craftmind-courses"
        items = [
            (f"{CR}/{P('craftmind-courses','items/spell_scroll.jpg')}","16x16 pixel art Minecraft item icon of a magic spell scroll, glowing runes, wizard academy"),
            (f"{CR}/{P('craftmind-courses','items/potion_brewing.jpg')}","16x16 pixel art Minecraft item icon of bubbling potion bottle, colorful, brewing station"),
            (f"{CR}/{P('craftmind-courses','items/magic_wand.jpg')}","16x16 pixel art Minecraft item icon of a magic wand, glowing tip, sparkles"),
            (f"{CR}/{P('craftmind-courses','items/encyclopedia.jpg')}","16x16 pixel art Minecraft item icon of thick encyclopedia book, gold lettering, knowledge"),
            (f"{CR}/{P('craftmind-courses','items/blackboard_advanced.jpg')}","16x16 pixel art Minecraft texture of advanced chalkboard with complex redstone circuit diagrams"),
            (f"{CR}/{P('craftmind-courses','items/trophy_first.jpg')}","16x16 pixel art Minecraft item icon of first place trophy cup, gold, achievement"),
            (f"{CR}/{P('craftmind-courses','items/team_badge.jpg')}","16x16 pixel art Minecraft item icon of team collaboration badge, students working together"),
            (f"{CR}/{P('craftmind-courses','npcs/librarian.jpg')}","Minecraft-style portrait of a school librarian, glasses, cardigan, surrounded by books, shushing"),
            (f"{CR}/{P('craftmind-courses','npcs/principal.jpg')}","Minecraft-style portrait of a school principal, formal, at desk, proud of students"),
            (f"{CR}/{P('craftmind-courses','npcs/janitor_wise.jpg')}","Minecraft-style portrait of a school janitor who secretly knows everything, wise, helpful"),
            (f"{CR}/{P('craftmind-courses','locations/library.jpg')}","Minecraft-style scene of a grand library, tall shelves, reading nooks, warm lamp light, magical knowledge"),
            (f"{CR}/{P('craftmind-courses','locations/courtyard.jpg')}","Minecraft-style scene of a school courtyard between classes, students gathering, trees, benches"),
        ]
        for filepath, prompt in items:
            gen(prompt, filepath)

    # HERDING extras
    if target in ("all", "herding"):
        print("\n🐕 HERDING — Creative extras", flush=True)
        HR = "/home/lucineer/projects/craftmind-herding"
        items = [
            (f"{HR}/{P('craftmind-herding','species/deer.jpg')}","16x16 pixel art Minecraft sprite of a deer, brown, antlers, standing in forest"),
            (f"{HR}/{P('craftmind-herding','species/elk.jpg')}","16x16 pixel art Minecraft sprite of an elk, large brown, impressive antlers, mountain meadow"),
            (f"{HR}/{P('craftmind-herding','species/moose.jpg')}","16x16 pixel art Minecraft sprite of a moose, massive, dark brown, pond background, Alaska"),
            (f"{HR}/{P('craftmind-herding','species/bear_cub.jpg')}","16x16 pixel art Minecraft sprite of a bear cub, small brown, climbing tree, adorable but dangerous mother nearby"),
            (f"{HR}/{P('craftmind-herding','species/beaver.jpg')}","16x16 pixel art Minecraft sprite of a beaver, brown, flat tail, building dam on stream"),
            (f"{HR}/{P('craftmind-herding','species/raven.jpg')}","16x16 pixel art Minecraft sprite of a raven, large black corvid, intelligent eyes, Alaska bird"),
            (f"{HR}/{P('craftmind-herding','items/dog_bowl.jpg')}","16x16 pixel art Minecraft item icon of dog water bowl, metal, with water"),
            (f"{HR}/{P('craftmind-herding','items/wool_yarn.jpg')}","16x16 pixel art Minecraft item icon of skein of wool yarn, natural white, spun from sheep wool"),
            (f"{HR}/{P('craftmind-herding','items/livestock_tag.jpg')}","16x16 pixel art Minecraft item icon of livestock ear tag, numbered, identification"),
            (f"{HR}/{P('craftmind-herding','items/trial_scoreboard.jpg')}","16x16 pixel art Minecraft item icon of herding trial scoreboard, scores and times"),
            (f"{HR}/{P('craftmind-herding','locations/sheep_pasture.jpg')}","Minecraft-style scene of green sheep pasture with flock grazing, rolling hills, farmhouse in distance"),
            (f"{HR}/{P('craftmind-herding','locations/herding_trial_arena.jpg')}","Minecraft-style scene of herding trial competition arena, course obstacles, crowd watching, dogs working"),
        ]
        for filepath, prompt in items:
            gen(prompt, filepath)

    # CIRCUITS extras
    if target in ("all", "circuits"):
        print("\n⚡ CIRCUITS — Creative extras", flush=True)
        CR = "/home/lucineer/projects/craftmind-circuits"
        items = [
            (f"{CR}/{P('craftmind-circuits','blocks/observer_side.jpg')}","16x16 pixel art Minecraft texture of observer block face, dots pattern, detecting block changes"),
            (f"{CR}/{P('craftmind-circuits','blocks/trapped_chest.jpg')}","16x16 pixel art Minecraft texture of trapped chest, looks like chest but has redstone circuit behind"),
            (f"{CR}/{P('craftmind-circuits','blocks/iron_trapdoor.jpg')}","16x16 pixel art Minecraft texture of iron trapdoor, thin metal door opened by redstone"),
            (f"{CR}/{P('craftmind-circuits','blocks/soul_torch.jpg')}","16x16 pixel art Minecraft item icon of soul torch, blue flame variant, different redstone behavior"),
            (f"{CR}/{P('craftmind-circuits','blocks/target_block.jpg')}","16x16 pixel art Minecraft item icon of target block, bullseye, emits redstone when hit by arrow"),
            (f"{CR}/{P('craftmind-circuits','blocks/lightning_rod.jpg')}","16x16 pixel art Minecraft item icon of lightning rod, copper, on roof, channels lightning"),
            (f"{CR}/{P('craftmind-circuits','blocks/sculk_sensor.jpg')}","16x16 pixel art Minecraft texture of sculk sensor, organic alien-looking block, detects vibrations"),
            (f"{CR}/{P('craftmind-circuits','blocks/calibrated_sculk.jpg')}","16x16 pixel art Minecraft texture of calibrated sculk sensor, advanced vibration detection"),
            (f"{CR}/{P('craftmind-circuits','items/redstone_schematic.jpg')}","32x32 pixel art icon of redstone circuit schematic drawing, technical diagram on paper"),
            (f"{CR}/{P('craftmind-circuits','items/blueprint_machine.jpg')}","32x32 pixel art icon of a complex machine blueprint, exploded view, engineering drawing"),
            (f"{CR}/{P('craftmind-circuits','npcs/inventor.jpg')}","Minecraft-style portrait of a redstone inventor, wild hair, surrounded by contraptions, eccentric genius"),
            (f"{CR}/{P('craftmind-circuits','npcs/student_redstone.jpg')}","Minecraft-style portrait of a student who just built their first redstone machine, amazed, lights working"),
        ]
        for filepath, prompt in items:
            gen(prompt, filepath)

    # RANCH extras
    if target in ("all", "ranch"):
        print("\n🐄 RANCH — Creative extras", flush=True)
        RR = "/home/lucineer/projects/craftmind-ranch"
        items = [
            (f"{RR}/{P('craftmind-ranch','species/cow_jersey.jpg')}","16x16 pixel art Minecraft sprite of a Jersey cow, brown with cream spots, gentle dairy cow"),
            (f"{RR}/{P('craftmind-ranch','species/pig_baby.jpg')}","16x16 pixel art Minecraft sprite of a baby piglet, pink, small, playful"),
            (f"{RR}/{P('craftmind-ranch','species/duck.jpg')}","16x16 pixel art Minecraft sprite of a duck, green head, white body, on pond"),
            (f"{RR}/{P('craftmind-ranch','species/mule.jpg')}","16x16 pixel art Minecraft sprite of a mule, brown, stocky, stubborn but strong"),
            (f"{RR}/{P('craftmind-ranch','species/peacock.jpg')}","16x16 pixel art Minecraft sprite of a peacock, displaying tail feathers, iridescent blue and green"),
            (f"{RR}/{P('craftmind-ranch','species/goat_baby.jpg')}","16x16 pixel art Minecraft sprite of a baby goat kid, jumping and playing, adorable"),
            (f"{RR}/{P('craftmind-ranch','items/milking_stool.jpg')}","16x16 pixel art Minecraft item icon of milking stool, wooden, three-legged, bucket beside"),
            (f"{RR}/{P('craftmind-ranch','items/egg_basket.jpg')}","16x16 pixel art Minecraft item icon of basket of fresh eggs, brown and white, straw lined"),
            (f"{RR}/{P('craftmind-ranch','items/milk_bottle.jpg')}","16x16 pixel art Minecraft item icon of glass milk bottle, fresh milk, cream top, farm fresh"),
            (f"{RR}/{P('craftmind-ranch','items/horse_saddle.jpg')}","16x16 pixel art Minecraft item icon of leather horse saddle, western style, detailed"),
            (f"{RR}/{P('craftmind-ranch','items/water_bucket.jpg')}","16x16 pixel art Minecraft item icon of wooden water bucket, for animals, handle"),
            (f"{RR}/{P('craftmind-ranch','locations/foaling_barn.jpg')}","Minecraft-style scene of a warm foaling barn, hay, soft light, mare and newborn foal"),
            (f"{RR}/{P('craftmind-ranch','locations/chicken_coop.jpg')}","Minecraft-style scene of a red chicken coop, chickens pecking around, eggs in nests, farm morning"),
            (f"{RR}/{P('craftmind-ranch','locations/pasture_sunrise.jpg')}","Minecraft-style scene of ranch pasture at sunrise, mist, animals waking, golden light, peaceful"),
        ]
        for filepath, prompt in items:
            gen(prompt, filepath)

    # RESEARCHER extras
    if target in ("all", "researcher"):
        print("\n🔬 RESEARCHER — Creative extras", flush=True)
        RR = "/home/lucineer/projects/craftmind-researcher"
        items = [
            (f"{RR}/{P('craftmind-researcher','items/telescope.jpg')}","16x16 pixel art Minecraft item icon of telescope, brass, on tripod, looking at stars"),
            (f"{RR}/{P('craftmind-researcher','items/electric_motor.jpg')}","16x16 pixel art Minecraft item icon of small electric motor, copper coils, experiment component"),
            (f"{RR}/{P('craftmind-researcher','items/magnet.jpg')}","16x16 pixel art Minecraft item icon of horseshoe magnet, iron, magnetic field lines visible"),
            (f"{RR}/{P('craftmind-researcher','items/prism.jpg')}","16x16 pixel art Minecraft item icon of glass prism, refracting rainbow light, optics experiment"),
            (f"{RR}/{P('craftmind-researcher','items/thermometer.jpg')}","16x16 pixel art Minecraft item icon of mercury thermometer, measuring temperature, scientific"),
            (f"{RR}/{P('craftmind-researcher','items/balance_scale.jpg')}","16x16 pixel art Minecraft item icon of precision balance scale, brass, measuring mass"),
            (f"{RR}/{P('craftmind-researcher','npcs/student_research.jpg')}","Minecraft-style portrait of an undergraduate research student, excited about first experiment, lab coat too big"),
            (f"{RR}/{P('craftmind-researcher','npcs/nobel_winner.jpg')}","Minecraft-style portrait of a famous Nobel-prize-winning scientist, distinguished, wise, inspiring"),
            (f"{RR}/{P('craftmind-researcher','locations/field_site.jpg')}","Minecraft-style scene of outdoor field research site, instruments, tents, data collection, wilderness"),
            (f"{RR}/{P('craftmind-researcher','locations/lecture_hall.jpg')}","Minecraft-style scene of a university lecture hall, professor at podium, students with notebooks"),
        ]
        for filepath, prompt in items:
            gen(prompt, filepath)

    print(f"\n{'='*60}")
    print(f"DONE. OK:{stats['ok']} SKIP:{stats['skip']} ERR:{stats['err']}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
