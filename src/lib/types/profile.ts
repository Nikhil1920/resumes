export interface ResumeLinksType {
    title: string;
    url: string;
}

export interface ProfileMetaDataType {
    id: string;
    name: string;
    last_updated: string;
    created: string;
    description: string;
    step: string;
}

export const defaultProfileMetaData: ProfileMetaDataType = {
    id: "",
    name: "",
    last_updated: new Date().toISOString(),
    created: new Date().toISOString(),
    description: "",
    step: "personal-info",
};

export interface ResumePersonalInfoType {
    name: string;
    email: string;
    phone: string;
    title_links: ResumeLinksType[];
}

export const defaultResumePersonalInfo: ResumePersonalInfoType = {
    name: "",
    email: "",
    phone: "",
    title_links: [],
};

export interface ResumeExperienceType {
    company: string;
    title: string;
    location: string;
    start_date: string;
    end_date: string;
    description: string;
}

export const defaultResumeExperience: ResumeExperienceType = {
    company: "",
    title: "",
    location: "",
    start_date: "",
    end_date: "",
    description: "",
};

export interface ResumeEducationType {
    institution: string;
    degree: string;
    start_date: string;
    end_date: string;
    description: string;
}

export const defaultResumeEducation: ResumeEducationType = {
    institution: "",
    degree: "",
    start_date: "",
    end_date: "",
    description: "",
};

export interface ResumeProjectType {
    title: string;
    description: string;
    skills: string[];
    start_date: string;
    end_date: string;
    links: ResumeLinksType[];
}
export const defaultResumeProject: ResumeProjectType = {
    title: "",
    description: "",
    skills: [],
    start_date: "",
    end_date: "",
    links: [],
};

export interface ResumeSkillType {
    name: string;
    category: string;
}

export const defaultResumeSkill: ResumeSkillType = {
    name: "",
    category: "",
};

export interface ProfileType {
    meta: ProfileMetaDataType;
    personal_info: ResumePersonalInfoType;
    experience: ResumeExperienceType[];
    education: ResumeEducationType[];
    projects: ResumeProjectType[];
    skills: ResumeSkillType[];
}

export const defaultProfile: ProfileType = {
    meta: defaultProfileMetaData,
    personal_info: {
        name: "",
        email: "",
        phone: "",
        title_links: [],
    },
    experience: [],
    education: [],
    projects: [],
    skills: [],
};
