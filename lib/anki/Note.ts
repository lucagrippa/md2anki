import log from 'loglevel';
import { Database } from "sql.js";
import Model from "./Model"; // Assuming Model class is defined in a separate file
import Card from "./Card"; // Assuming Card class is defined in a separate file
import { generateGuidFor } from "./util"; // Assuming these utility functions are defined in a separate file

class TagList extends Array<string> {
    private static validateTag(tag: string): void {
        if (tag.includes(" ")) {
            throw new Error(`Tag "${tag}" contains a space; this is not allowed!`);
        }
    }

    constructor(tags: string[] = []) {
        super();
        this.push(...tags);
    }

    push(...items: string[]): number {
        log.debug(`Adding tags: ${items.join(", ")}`);
        items.forEach(TagList.validateTag);
        return super.push(...items);
    }

    unshift(...items: string[]): number {
        log.debug(`Unshifting tags: ${items.join(", ")}`);
        items.forEach(TagList.validateTag);
        return super.unshift(...items);
    }

    splice(start: number, deleteCount: number = 0, ...items: string[]): string[] {
        log.debug(`Splicing tags: ${items.join(", ")}`);
        items.forEach(TagList.validateTag);
        return super.splice(start, deleteCount, ...items);
    }
}

class Note {
    private static readonly INVALID_HTML_TAG_REGEX = /<(?!\/?[a-zA-Z0-9]+(?: .*|\/?)>|!--|!\[CDATA\[)(?:.|\n)*?>/g;

    private model: Model;
    private fields: string[];
    private _sortField: string | null;
    private _tags: TagList;
    private dueDate: number;
    private guidValue: string | null;
    private cardsCache: Card[] | null = null;

    constructor(
        model: Model | null = null,
        fields: string[] | null = null,
        sortField: string | null = null,
        tags: string[] | null = null,
        guid: string | null = null,
        dueDate: number = 0
    ) {
        this.model = model!;
        this.fields = fields || [];
        this._sortField = sortField;
        this._tags = new TagList(tags || []);
        this.dueDate = dueDate;
        this.guidValue = guid;
    }

    public getModel(): Model {
        log.debug(`Get model ${this.model}`);
        return this.model;
    }

    /**
     * Getter for sortField
     */
    get sortField(): string {
        log.debug(`Getting sort field: ${this._sortField}`);
        return this._sortField || this.fields[this.model.getSortFieldIndex()];
    }

    /**
     * Setter for sortField
     */
    set sortField(value: string | null) {
        log.debug(`Setting sort field to ${value}`);
        this._sortField = value;
    }

    /**
     * Getter for tags
     */
    get tags(): TagList {
        log.debug(`Getting tags: ${this._tags.join(", ")}`);
        return this._tags;
    }

    /**
     * Setter for tags
     */
    set tags(value: string[]) {
        log.debug(`Setting tags to ${value.join(", ")}`);
        this._tags = new TagList(value);
    }

    /**
     * Getter for cards
     */
    get cards(): Card[] {
        log.debug(`Getting cards`);
        if (this.cardsCache === null) {
            if (this.model.getModelType() === Model.FRONT_BACK) {
                this.cardsCache = this.createFrontBackCards();
            } else if (this.model.getModelType() === Model.CLOZE) {
                this.cardsCache = this.createClozeCards();
            } else {
                throw new Error("Expected model_type CLOZE or FRONT_BACK");
            }
        }
        return this.cardsCache;
    }

    /**
     * Creates cloze cards
     */
    private createClozeCards(): Card[] {
        log.debug(`Creating cloze cards`);

        const cardOrds = new Set<number>();
        const clozeReplacements = new Set<string>();

        // Find cloze replacements in first template's qfmt, e.g "{{cloze::Text}}"
        const qfmt = this.model.getTemplates()[0].qfmt;
        const regex1 = /{{[^}]*?cloze:(?:[^}]?:)*(.+?)}}/g;
        const regex2 = /<%cloze:(.+?)%>/g;
        let match;

        while ((match = regex1.exec(qfmt)) !== null) {
            clozeReplacements.add(match[1]);
        }
        while ((match = regex2.exec(qfmt)) !== null) {
            clozeReplacements.add(match[1]);
        }

        const clozeReplacementsArray = Array.from(clozeReplacements);
        for (const fieldName of clozeReplacementsArray) {
            const fieldIndex = this.model.getFields().findIndex(f => f.name === fieldName);
            const fieldValue = fieldIndex >= 0 ? this.fields[fieldIndex] : "";
            const clozeRegex = /{{c(\d+)::.+?}}/g;
            while ((match = clozeRegex.exec(fieldValue)) !== null) {
                const clozeNumber = parseInt(match[1], 10);
                if (clozeNumber > 0) {
                    cardOrds.add(clozeNumber - 1);
                }
            }
        }

        if (cardOrds.size === 0) {
            cardOrds.add(0);
        }

        return Array.from(cardOrds).map(ord => new Card(ord));
    }

    /**
     * Creates front/back cards
     */
    private createFrontBackCards(): Card[] {
        log.debug(`Creating front/back cards`);

        const cards: Card[] = [];
        for (const [cardOrd, anyOrAll, requiredFieldOrds] of this.model.req) {
            const op = anyOrAll === "any" ? (arr: boolean[]) => arr.some(Boolean) : (arr: boolean[]) => arr.every(Boolean);
            if (op(requiredFieldOrds.map((ord: number)  => Boolean(this.fields[ord])))) {
                cards.push(new Card(cardOrd));
            }
        }
        return cards;
    }

    /**
     * Getter for guid
     */
    get guid(): string {
        log.debug(`Getting guid`);

        if (this.guidValue === null) {
            return generateGuidFor(...this.fields);
        }
        return this.guidValue;
    }

    /**
     * Setter for guid
     */
    set guid(value: string) {
        log.debug(`Setting guid to ${value}`);

        this.guidValue = value;
    }

    /**
     * Checks if the number of fields in the model matches the number of fields in the note
     */
    private checkNumberModelFieldsMatchesNumFields(): void {
        log.debug(`Checking number of fields`);

        if (this.model.getFields().length !== this.fields.length) {
            throw new Error(
                `Number of fields in Model does not match number of fields in Note: ` +
                `${this.model} has ${this.model.getFields().length} fields, but ${this} has ${this.fields.length} fields.`
            );
        }
    }

    /**
     * Finds invalid HTML tags in a field
     */
    private static findInvalidHtmlTagsInField(field: string): RegExpMatchArray | null {
        log.debug(`Finding invalid HTML tags in field`);

        return field.match(Note.INVALID_HTML_TAG_REGEX);
    }

    /**
     * Checks for invalid HTML tags in fields
     */
    private checkInvalidHtmlTagsInFields(): void {
        log.debug(`Checking for invalid HTML tags in fields`);

        for (const field of this.fields) {
            const invalidTags = Note.findInvalidHtmlTagsInField(field);
            if (invalidTags) {
                console.warn(
                    "Field contained the following invalid HTML tags. Make sure you are calling html.escape() if" +
                    ` your field data isn't already HTML-encoded: ${invalidTags.join(" ")}`
                );
            }
        }
    }

    /**
     * Writes the note to the database
     */
    public writeToDb(db: Database, timestamp: number, deckId: number, idGenerator: Iterator<number>): void {
        log.debug(`Writing note to DB`);
        this.checkNumberModelFieldsMatchesNumFields();
        this.checkInvalidHtmlTagsInFields();

        const stmt = db.prepare(
            "INSERT INTO notes VALUES(?,?,?,?,?,?,?,?,?,?,?)"
        );

        stmt.run([
            idGenerator.next().value,   // id
            this.guid,                  // guid
            this.model.getModelId(),         // mid
            Math.floor(timestamp),      // mod
            -1,                         // usn
            this.formatTags(),          // tags
            this.formatFields(),        // flds
            this.sortField,             // sfld
            0,                          // csum, can be ignored
            0,                          // flags
            "",                         // data
        ]);

        const noteId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

        for (const card of this.cards) {
            card.writeToDb(db, timestamp, deckId, noteId, idGenerator, this.dueDate);
        }
    }

    /**
     * Formats fields for database insertion
     */
    private formatFields(): string {
        log.debug(`Formatting fields`);
        return this.fields.join("\x1f");
    }

    /**
     * Formats tags for database insertion
     */
    private formatTags(): string {
        log.debug(`Formatting tags`);
        return ` ${this._tags.join(" ")} `;
    }

    /**
     * Returns a string representation of the Note
     */
    public toString(): string {
        log.debug(`Converting note to string`);
        const attrs = ["model", "fields", "sortField", "tags", "guid"];
        const pieces = attrs.map(attr => `${attr}=${JSON.stringify((this as any)[attr])}`);
        return `Note(${pieces.join(", ")})`;
    }
}

export { TagList, Note };