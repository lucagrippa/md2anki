import Model from './Model';

const BASIC_MODEL = new Model(
    1559383000,
    'Basic (md2anki)',
    [
        {
            name: 'Front',
            font: 'Arial',
        },
        {
            name: 'Back',
            font: 'Arial',
        },
    ],
    [
        {
            name: 'Card 1',
            qfmt: '{{Front}}',
            afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}',
        },
    ],
    '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n'
);

const BASIC_AND_REVERSED_CARD_MODEL = new Model(
    1485830179,
    'Basic (and reversed card) (md2anki)',
    [
        {
            name: 'Front',
            font: 'Arial',
        },
        {
            name: 'Back',
            font: 'Arial',
        },
    ],
    [
        {
            name: 'Card 1',
            qfmt: '{{Front}}',
            afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}',
        },
        {
            name: 'Card 2',
            qfmt: '{{Back}}',
            afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}',
        },
    ],
    '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n'
);

const BASIC_OPTIONAL_REVERSED_CARD_MODEL = new Model(
    1382232460,
    'Basic (optional reversed card) (md2anki)',
    [
        {
            name: 'Front',
            font: 'Arial',
        },
        {
            name: 'Back',
            font: 'Arial',
        },
        {
            name: 'Add Reverse',
            font: 'Arial',
        },
    ],
    [
        {
            name: 'Card 1',
            qfmt: '{{Front}}',
            afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}',
        },
        {
            name: 'Card 2',
            qfmt: '{{#Add Reverse}}{{Back}}{{/Add Reverse}}',
            afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Front}}',
        },
    ],
    '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n'
);

const BASIC_TYPE_IN_THE_ANSWER_MODEL = new Model(
    1305534440,
    'Basic (type in the answer) (md2anki)',
    [
        {
            name: 'Front',
            font: 'Arial',
        },
        {
            name: 'Back',
            font: 'Arial',
        },
    ],
    [
        {
            name: 'Card 1',
            qfmt: '{{Front}}\n\n{{type:Back}}',
            afmt: '{{Front}}\n\n<hr id=answer>\n\n{{type:Back}}',
        },
    ],
    '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n'
);

const CLOZE_MODEL = new Model(
    1550428389,
    'Cloze (md2anki)',
    [
        {
            name: 'Text',
            font: 'Arial',
        },
        {
            name: 'Back Extra',
            font: 'Arial',
        },
    ],
    [
        {
            name: 'Cloze',
            qfmt: '{{cloze:Text}}',
            afmt: '{{cloze:Text}}<br>\n{{Back Extra}}',
        },
    ],
    '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n\n' +
    '.cloze {\n font-weight: bold;\n color: blue;\n}\n.nightMode .cloze {\n color: lightblue;\n}',
    Model.CLOZE
);

export {
    BASIC_MODEL,
    BASIC_AND_REVERSED_CARD_MODEL,
    BASIC_OPTIONAL_REVERSED_CARD_MODEL,
    BASIC_TYPE_IN_THE_ANSWER_MODEL,
    CLOZE_MODEL,
};