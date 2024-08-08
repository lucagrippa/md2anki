import log from 'loglevel';
import { Database } from "sql.js";

class Card {
    private readonly ordinal: number;
    private readonly suspend: boolean;

    constructor(ord: number, suspend: boolean = false) {
        this.ordinal = ord;
        this.suspend = suspend;
    }

    public writeToDb(
        db: Database,
        timestamp: number,
        deckId: number,
        noteId: number,
        idGen: Iterator<number>,
        due: number = 0
    ): void {
        log.debug(`Writing card to DB`);
        const queue: number = this.suspend ? -1 : 0;

        try {
            db.run(
                "INSERT INTO cards VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [
                    idGen.next().value,  // id
                    noteId,              // nid (note id)
                    deckId,              // did (deck id)
                    this.ordinal,        // ord (card template ordinal)
                    Math.floor(timestamp), // mod (modification timestamp)
                    -1,                  // usn (update sequence number)
                    0,                   // type (0 for non-Cloze)
                    queue,               // queue (-1 if suspended, 0 otherwise)
                    due,                 // due date
                    0,                   // ivl (interval)
                    0,                   // factor (ease factor)
                    0,                   // reps (number of reviews)
                    0,                   // lapses
                    0,                   // left
                    0,                   // odue (original due)
                    0,                   // odid (original deck id)
                    0,                   // flags
                    "",                  // data (additional data)
                ]
            );
        } catch (err) {
            console.error("Error inserting card:", err);
            // Handle the error appropriately
            throw err; // Re-throw the error for higher-level error handling
        }
    }
}

export default Card;