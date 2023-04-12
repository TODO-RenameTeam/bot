export interface TextCommand {
    id:          string;
    name:        string;
    template:    string;
    text:        string;
    images:      string[];
    urls:        string[];
    quizesCount: number;
    buttons:     Button[];
    quizes:      Quiz[];
}

export interface Button {
    id:   string;
    name: string;
    key:  string;
    type: string;
}

export interface Quiz {
    id:            string;
    name:          string;
    text:          string;
    options:       string[];
    rightOptionID: number;
    textCommands:  null[];
    steps:         any[];
}

