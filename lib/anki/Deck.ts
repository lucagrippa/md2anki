import log from 'loglevel';
import { Database } from "sql.js";

// Importing required types and classes
import { Note } from "./Note"; // Assuming Note class is defined in a separate file
import Model from "./Model"; // Assuming Model class is defined in a separate file
import { Package } from "./Package"; // Assuming Package class is defined in a separate file

interface DeckJson {
    collapsed: boolean;
    conf: number;
    desc: string;
    dyn: number;
    extendNew: number;
    extendRev: number;
    id: number;
    lrnToday: [number, number];
    mod: number;
    name: string;
    newToday: [number, number];
    revToday: [number, number];
    timeToday: [number, number];
    usn: number;
}

class Deck {
    private deckId: number;
    private deckName: string;
    private description: string;
    private notes: Note[];
    private models: Map<number, Model>;

    constructor(deckId: number, deckName: string, description: string = "") {
        this.deckId = deckId;
        this.deckName = deckName;
        this.description = description;
        this.notes = [];
        this.models = new Map<number, Model>();
    }

    /**
     * Adds a note to the deck
     * @param note The note to add
     */
    public addNote(note: Note): void {
        log.debug(`Adding note: ${note.guid}`);
        this.notes.push(note);
    }

    /**
     * Adds a model to the deck
     * @param model The model to add
     */
    public addModel(model: Model): void {
        log.debug(`Adding model: ${model.getModelId()}`);
        this.models.set(model.getModelId(), model);
    }

    /**
     * Converts the deck to a JSON representation
     * @returns A JSON object representing the deck
     */
    public toJson(): DeckJson {
        log.debug(`Converting deck to JSON: ${this.deckName}`);
        return {
            collapsed: false,
            conf: 1,
            desc: this.description,
            dyn: 0,
            extendNew: 0,
            extendRev: 50,
            id: this.deckId,
            lrnToday: [163, 2],
            mod: 1425278051,
            name: this.deckName,
            newToday: [163, 2],
            revToday: [163, 0],
            timeToday: [163, 23598],
            usn: -1
        };
    }

    /**
     * Writes the deck to the database
     * @param db The SQL.js database connection
     * @param timestamp The current timestamp
     * @param idGenerator A generator for unique IDs
     */
    public writeToDb(db: Database, timestamp: number, idGenerator: Iterator<number>): void {
        if (typeof this.deckId !== "number") {
            throw new TypeError(`Deck .deckId must be a number, not ${typeof this.deckId}.`);
        }
        if (typeof this.deckName !== "string") {
            throw new TypeError(`Deck .deckName must be a string, not ${typeof this.deckName}.`);
        }
        
        log.debug(`Writing deck to database: ${this.deckName}`);
        
        // Update decks in the database
        const decksResult = db.exec("SELECT decks FROM col");
        let decks = JSON.parse(decksResult[0].values[0][0] as string);
        decks[this.deckId.toString()] = this.toJson();
        db.run("UPDATE col SET decks = ?", [JSON.stringify(decks)]);

        // Update models in the database
        const modelsResult = db.exec("SELECT models FROM col");
        let models = JSON.parse(modelsResult[0].values[0][0] as string);
        this.notes.forEach(note => {
            const model = note.getModel();
            this.addModel(model);
        });
        this.models.forEach((model, modelId) => {
            models[modelId] = model.toJson(timestamp, this.deckId!);
        });
        db.run("UPDATE col SET models = ?", [JSON.stringify(models)]);

        // Write notes to the database
        this.notes.forEach(note => note.writeToDb(db, timestamp, this.deckId!, idGenerator));
    }

    /**
     * Writes the deck to a .apkg file
     * @param file The file to write to
     */
    public writeToFile(file: string): void {
        log.debug(`Writing deck ${this.deckId} to file`);
        new Package(this).writeToFile(file);
    }
}

export default Deck;