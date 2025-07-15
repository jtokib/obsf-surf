export default class PersonalityGenerator {
    constructor() {
        this.adjectives = [
            "groovy", "funky", "cosmic", "radical", "gnarly", "tubular", "wicked",
            "stellar", "epic", "legendary", "mystical", "peculiar", "quirky",
            "zany", "whimsical", "eccentric", "bizarre", "oddball", "kooky",
            "wacky", "silly", "goofy", "dorky", "nerdy", "hipster", "vintage",
            "retro", "neon", "electric", "magnetic", "charismatic", "mysterious",
            "enigmatic", "cryptic", "sneaky", "mischievous", "playful", "bouncy",
            "springy", "zippy", "peppy", "snappy", "jazzy", "bluesy", "rockin'",
            "groovin'", "chillin'", "vibin'", "surfin'", "skateboard", "freestyle"
        ];

        this.nouns = [
            "wizard", "ninja", "pirate", "robot", "cyborg", "alien", "unicorn",
            "dragon", "phoenix", "werewolf", "vampire", "zombie", "ghost",
            "superhero", "villain", "detective", "spy", "astronaut", "scientist",
            "inventor", "artist", "musician", "dancer", "comedian", "magician",
            "chef", "barista", "librarian", "teacher", "student", "philosopher",
            "explorer", "adventurer", "treasure hunter", "time traveler", "nomad",
            "wanderer", "dreamer", "storyteller", "poet", "writer", "blogger",
            "influencer", "gamer", "streamer", "cosplayer", "collector", "curator",
            "dolphin", "penguin", "sloth", "llama", "narwhal", "octopus", "jellyfish",
            "seahorse", "starfish", "turtle", "whale", "shark", "manta ray",
            "surfer", "skater", "snowboarder", "climber", "hiker", "camper",
            "biker", "runner", "swimmer", "diver", "sailor", "captain", "navigator",
            "pilot", "driver", "mechanic", "engineer", "architect", "designer",
            "photographer", "filmmaker", "podcaster", "DJ", "producer", "curator",
            "food truck", "coffee shop", "bookstore", "arcade", "dojo", "laboratory",
            "spaceship", "submarine", "castle", "treehouse", "lighthouse", "observatory"
        ];

        this.usedCombinations = new Set();
    }

    generateUniqueCombination() {
        let attempts = 0;
        let combination;

        do {
            const adjective = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
            const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
            combination = `${adjective} ${noun}`;
            attempts++;

            if (attempts > 50) {
                this.usedCombinations.clear();
                break;
            }
        } while (this.usedCombinations.has(combination));

        this.usedCombinations.add(combination);
        if (this.usedCombinations.size > 20) {
            const firstItem = this.usedCombinations.values().next().value;
            this.usedCombinations.delete(firstItem);
        }

        return combination;
    }

    getStats() {
        return {
            totalCombinations: this.adjectives.length * this.nouns.length,
            currentOptions: `${this.adjectives.length} adjectives × ${this.nouns.length} nouns`
        };
    }
  }