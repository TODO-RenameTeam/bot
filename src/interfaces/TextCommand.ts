export interface TextCommand {
    id:          string;
    name:        string;
    template:    string;
    text:        string;
    images:      string[];
    urls:        string[];
    quizesCount: number;
    buttons:     Button[];
}

export interface Button {
    id:   string;
    name: string;
    key:  string;
    type: string;
}
