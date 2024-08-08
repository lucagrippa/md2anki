import log from 'loglevel';
import initSqlJs, { Database } from "sql.js";
import { saveAs } from 'file-saver';
import JSZip from "jszip";
import Deck from "./Deck";
import { APKG_SCHEMA } from "./apkg_schema";
import { APKG_COL } from "./apkg_col";


class Package {
    private decks: Deck[];
    private mediaFiles?: File[];

    /**
     * Creates a new Package instance
     * @param deckOrDecks A single Deck or an array of Decks
     * @param mediaFiles An array of media file paths
     */
    constructor(deckOrDecks: Deck | Deck[] | null = null, mediaFiles?: File[]) {
        this.decks = Array.isArray(deckOrDecks) ? deckOrDecks : (deckOrDecks ? [deckOrDecks] : []);
        this.mediaFiles = mediaFiles;
    }

    /**
     * Writes the package to a file
     * @param fileName File name to write to
     * @param timestamp Timestamp to assign to generated notes/cards. Defaults to current time
     */
    public async writeToFile(fileName: string, timestamp: number | null = null): Promise<void> {
        log.debug(`Writing package to file: ${fileName}`);

        if (timestamp === null) {
            timestamp = Date.now() / 1000; // Convert to seconds
        }

        log.debug("Initializing SQL.js");
        const SQL = await initSqlJs({
            locateFile: (file) => {
                // if (file.endsWith('.wasm')) {
                //     // Dynamically import the wasm file
                //     const wasmBinary = await wasmBinaryUrl();
                //     // The default export is the URL to the wasm file
                //     return wasmBinary.default;
                // }
                return `https://sql.js.org/dist/${file}`;
            },
        });
        log.debug("Creating database...");
        const db = new SQL.Database();
        log.debug("Database created");

        const idGenerator = this.createIdGenerator(Math.floor(timestamp * 1000));

        await this.writeToDb(db, timestamp, idGenerator);

        const zipFile = new JSZip();

        // Add database to zip
        const dbBuffer = db.export();
        zipFile.file("collection.anki2", dbBuffer);

        // Add media files to zip if they exist
        if (this.mediaFiles && this.mediaFiles.length > 0) {
            const mediaJson: { [key: number]: string } = {};
            for (let i = 0; i < this.mediaFiles.length; i++) {
                const file = this.mediaFiles[i];
                mediaJson[i] = file.name;
                zipFile.file(i.toString(), file);
            }
            zipFile.file("media", JSON.stringify(mediaJson));
        } else {
            // If no media files, add an empty media JSON
            zipFile.file("media", "{}");
        }

        // Generate zip file
        const zipContent = await zipFile.generateAsync({ type: "blob" });
        // await fs.promises.writeFile(filePath, zipContent);
        saveAs(zipContent, fileName);
    }

    /**
     * Writes the package content to the database
     * @param db SQL.js Database instance
     * @param timestamp Timestamp for the package
     * @param idGenerator Generator function for unique IDs
     */
    private async writeToDb(db: Database, timestamp: number, idGenerator: Iterator<number>): Promise<void> {
        log.debug(`Writing package to database`);

        db.run(APKG_SCHEMA);
        db.run(APKG_COL);

        for (const deck of this.decks) {
            await deck.writeToDb(db, timestamp, idGenerator);
        }
    }

    /**
     * Creates an ID generator
     * @param initialId The initial ID to start from
     */
    private createIdGenerator(initialId: number): IterableIterator<number> {
        log.debug(`Creating ID generator starting from ${initialId}`);
        let currentId = initialId;
        return {
            next: () => ({ value: currentId++, done: false }),
            [Symbol.iterator](): IterableIterator<number> {
                return this;
            }
            // [Symbol.iterator]: function() { return this; }
        };
    }
}

export { Package };