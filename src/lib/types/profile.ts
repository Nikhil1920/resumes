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
    description: "<ul><li></li></ul>",
};

export interface ResumeEducationType {
    institution: string;
    location: string;
    degree: string;
    start_date: string;
    end_date: string;
    description: string;
}

export const defaultResumeEducation: ResumeEducationType = {
    institution: "",
    location: "",
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
    description: "<ul><li></li></ul>",
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

export interface ResumeCategoriesType {
    id: string;
    name: string;
    description: string;
}

export const allCategories: ResumeCategoriesType[] = [
    {
        id: "summary",
        name: "Profile Summary",
        description: "A brief summary of your professional background.",
    },
    {
        id: "experience",
        name: "Experience",
        description: "Work experience and internships.",
    },
    {
        id: "education",
        name: "Education",
        description: "Educational background.",
    },
    {
        id: "projects",
        name: "Projects",
        description: "Personal or professional projects.",
    },
    {
        id: "skills",
        name: "Skills",
        description: "Technical and soft skills.",
    },
    {
        id: "certifications",
        name: "Certifications",
        description: "Professional certifications and licenses.",
    },
    {
        id: "awards",
        name: "Awards",
        description: "Awards and recognitions.",
    },
    {
        id: "languages",
        name: "Languages",
        description: "Languages spoken and proficiency levels.",
    },
];

export interface ProfileConfigType {
    categories: ResumeCategoriesType[];
    page_size: "A4" | "Letter";
    template: string;
}

export const defaultProfileConfig: ProfileConfigType = {
    categories: [
        {
            id: "experience",
            name: "Experience",
            description: "Work experience and internships.",
        },
        {
            id: "education",
            name: "Education",
            description: "Educational background.",
        },
        {
            id: "projects",
            name: "Projects",
            description: "Personal or professional projects.",
        },
        {
            id: "skills",
            name: "Skills",
            description: "Technical and soft skills.",
        },
    ],
    page_size: "A4",
    template: "tenali",
};

export interface ResumeLanguageType {
    name: string;
    proficiency: "Basic" | "Conversational" | "Proficient" | "Fluent";
}

export interface ProfileType {
    meta: ProfileMetaDataType;
    config: ProfileConfigType;
    personal_info: ResumePersonalInfoType;
    summary: string;
    experience: ResumeExperienceType[];
    education: ResumeEducationType[];
    projects: ResumeProjectType[];
    skills: ResumeSkillType[];
    certifications: string[];
    awards: string;
    languages: ResumeLanguageType[];
}

export const defaultProfile: ProfileType = {
    meta: defaultProfileMetaData,
    config: defaultProfileConfig,
    personal_info: {
        name: "",
        email: "",
        phone: "",
        title_links: [],
    },
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    awards: "<ul><li></li></ul>",
    languages: [],
};

export const demoProfile: ProfileType = {
    meta: { ...defaultProfileMetaData, name: "John Cena", id: "demo" },
    config: { ...defaultProfileConfig, categories: allCategories },
    personal_info: {
        name: "",
        email: "",
        phone: "",
        title_links: [],
    },
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
    awards: "<ul><li></li></ul>",
    languages: [],
};
