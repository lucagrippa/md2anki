import log from 'loglevel';
import yaml from "js-yaml";
import Mustache from "mustache";

interface Field {
    name: string;
    ord?: number;
    font?: string;
    media?: string[];
    rtl?: boolean;
    size?: number;
    sticky?: boolean;
}

interface Template {
    name: string;
    qfmt: string;
    afmt: string;
    ord?: number;
    bafmt?: string;
    bqfmt?: string;
    bfont?: string;
    bsize?: number;
    did?: number | null;
}

class Model {
    public static readonly FRONT_BACK = 0;
    public static readonly CLOZE = 1;
    public static readonly DEFAULT_LATEX_PRE =
        "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n" +
        "\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n" +
        "\\begin{document}\n";
    public static readonly DEFAULT_LATEX_POST = "\\end{document}";

    private modelId: number;
    private modelName: string | null;
    private fields!: Field[];
    private templates!: Template[];
    private css: string;
    private modelType: number;
    private latexPre: string;
    private latexPost: string;
    private sortFieldIndex: number;
    private reqCache: any[] | null = null;

    constructor(
        modelId: number,
        modelName: string | null = null,
        fields: Field[] | string | null = null,
        templates: Template[] | string | null = null,
        css: string = "",
        modelType: number = Model.FRONT_BACK,
        latexPre: string = Model.DEFAULT_LATEX_PRE,
        latexPost: string = Model.DEFAULT_LATEX_POST,
        sortFieldIndex: number = 0
    ) {
        this.modelId = modelId;
        this.modelName = modelName;
        this.setFields(fields);
        this.setTemplates(templates);
        this.css = css;
        this.modelType = modelType;
        this.latexPre = latexPre;
        this.latexPost = latexPost;
        this.sortFieldIndex = sortFieldIndex;
    }

    public getModelId(): number {
        log.debug(`Fetching model ID ${this.modelId}`);
        return this.modelId;
    }

    public getModelType(): number {
        log.debug(`Fetching model type ${this.modelType}`);
        return this.modelType;
    }

    public getSortFieldIndex(): number {
        log.debug(`Fetching model sort field index ${this.sortFieldIndex}`);
        return this.sortFieldIndex;
    }

    /**
     * Sets the fields of the model
     * @param fields Array of Field objects or YAML string
     */
    public setFields(fields: Field[] | string | null): void {
        log.debug(`Setting model fields ${this.fields}`);
        if (Array.isArray(fields)) {
            this.fields = fields;
        } else if (typeof fields === "string") {
            this.fields = yaml.load(fields) as Field[];
        } else {
            this.fields = [];
        }
    }

    public getFields(): Field[] {
        log.debug(`Fetching model fields ${this.fields}`);
        return this.fields;
    }
    
    /**
     * Sets the templates of the model
     * @param templates Array of Template objects or YAML string
     */
    public setTemplates(templates: Template[] | string | null): void {
        log.debug(`Setting model templates ${this.templates}`);
        if (Array.isArray(templates)) {
            this.templates = templates;
        } else if (typeof templates === "string") {
            this.templates = yaml.load(templates) as Template[];
        } else {
            this.templates = [];
        }
    }

    public getTemplates(): Template[] {
        log.debug(`Fetching model templates ${this.templates}`);
        return this.templates;
    }

    /**
     * Computes the required fields for each template
     * @returns List of required fields for each template
     */
    public get req(): any[] {
        log.debug(`Computing required fields for model`);
        if (this.reqCache) {
            return this.reqCache;
        }

        const sentinel = "SeNtInEl";
        const fieldNames = this.fields.map(field => field.name);

        const req: any[] = [];
        this.templates.forEach((template, templateOrd) => {
            const requiredFields: number[] = [];
            fieldNames.forEach((field, fieldOrd) => {
                const fieldValues: { [key: string]: string } = Object.fromEntries(
                    fieldNames.map(f => [f, sentinel])
                );
                fieldValues[field] = "";

                const rendered = Mustache.render(template.qfmt, fieldValues);

                if (!rendered.includes(sentinel)) {
                    requiredFields.push(fieldOrd);
                }
            });

            if (requiredFields.length > 0) {
                req.push([templateOrd, "all", requiredFields]);
                return;
            }

            fieldNames.forEach((field, fieldOrd) => {
                const fieldValues: { [key: string]: string } = Object.fromEntries(
                    fieldNames.map(f => [f, ""])
                );
                fieldValues[field] = sentinel;

                const rendered = Mustache.render(template.qfmt, fieldValues);

                if (rendered.includes(sentinel)) {
                    requiredFields.push(fieldOrd);
                }
            });

            if (requiredFields.length === 0) {
                throw new Error(`Could not compute required fields for this template; please check the formatting of "qfmt": ${JSON.stringify(template)}`);
            }

            req.push([templateOrd, "any", requiredFields]);
        });

        this.reqCache = req;
        return req;
    }

    /**
     * Converts the model to a JSON representation
     * @param timestamp Current timestamp
     * @param deckId ID of the deck this model belongs to
     * @returns JSON representation of the model
     */
    public toJson(timestamp: number, deckId: number): any {
        log.debug(`Converting model to JSON: ${this.modelName}`);

        this.templates.forEach((tmpl, ord) => {
            tmpl.ord = ord;
            tmpl.bafmt = tmpl.bafmt || "";
            tmpl.bqfmt = tmpl.bqfmt || "";
            tmpl.bfont = tmpl.bfont || "";
            tmpl.bsize = tmpl.bsize || 0;
            tmpl.did = tmpl.did === undefined ? null : tmpl.did; 
        });

        this.fields.forEach((field, ord) => {
            field.ord = ord;
            field.font = field.font || "Liberation Sans";
            field.media = field.media || [];
            field.rtl = field.rtl || false;
            field.size = field.size || 20;
            field.sticky = field.sticky || false;
        });

        return {
            css: this.css,
            did: deckId,
            flds: this.fields,
            id: this.modelId?.toString(),
            latexPost: this.latexPost,
            latexPre: this.latexPre,
            latexsvg: false,
            mod: Math.floor(timestamp),
            name: this.modelName,
            req: this.req,
            sortf: this.sortFieldIndex,
            tags: [],
            tmpls: this.templates,
            type: this.modelType,
            usn: -1,
            vers: []
        };
    }
}

export default Model;