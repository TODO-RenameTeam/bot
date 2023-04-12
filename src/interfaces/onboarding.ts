export interface RoleOnboarding {
    id:            string;
    positionID:    string;
    position:      Position;
    stepsCount:    number;
    userSteps:     Array<UserOnboarding | null>;
    steps:         Step[];
    stepPositions: StepPositionElement[];
}

export interface Position {
    id:   string;
    name: string;
}

export interface Step {
    id:                      string;
    name:                    string;
    text:                    string;
    images:                  string[];
    urls:                    string[];
    quizesCount:             number;
    quizes:                  any[];
    roleOnboardings:         null[];
    roleOnboardingPositions: StepPositionElement[];
}

export interface StepPositionElement {
    roleOnboardingID: string;
    stepID:           string;
    step?:            Step;
    position:         number;
}


export interface UserOnboarding {
    id:                string;
    userID:            string;
    user:              User;
    roleOnboardingID:  string;
    roleOnboarding?:   RoleOnboarding;
    userCurrentStepID: string;
    userCurrentStep:   UserCurrentStep;
    dateTimeStart:     Date;
}

export interface User {
    id:         string;
    telegramID: number;
    lastName:   string;
    firstName:  string;
    middleName: string;
    fullName:   string;
    role:       string;
    positionID: string;
}

export interface UserCurrentStep {
    id:                      string;
    name:                    string;
    text:                    string;
    images:                  string[];
    urls:                    string[];
    quizesCount:             number;
    quizes:                  any[];
    roleOnboardings:         any[];
    roleOnboardingPositions: any[];
}




export interface User {
    id:         string;
    telegramID: number;
    lastName:   string;
    firstName:  string;
    middleName: string;
    fullName:   string;
    role:       string;
    positionID: string;
}

export interface UserCurrentStep {
    id:                      string;
    name:                    string;
    text:                    string;
    images:                  string[];
    urls:                    string[];
    quizesCount:             number;
    quizes:                  any[];
    roleOnboardings:         any[];
    roleOnboardingPositions: any[];
}
