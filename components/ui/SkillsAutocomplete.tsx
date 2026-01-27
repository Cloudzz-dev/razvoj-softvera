"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Check, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

const SUGGESTED_SKILLS = [
    // Development
    "React", "TypeScript", "Next.js", "Node.js", "Python", "JavaScript",
    "HTML/CSS", "TailwindCSS", "PostgreSQL", "GraphQL", "AWS", "Docker",
    "Kubernetes", "Rust", "Go", "Java", "C++", "C#", "PHP", "Laravel",
    "Django", "Flask", "Vue.js", "Angular", "Svelte", "Mobile Dev",
    "React Native", "Flutter", "iOS", "Android", "Solidity", "Web3",

    // Design & Product
    "UI/UX Design", "Figma", "Product Management", "Product Strategy",
    "User Research", "Prototyping", "Graphic Design", "Branding",
    "Web Design", "Motion Design",

    // Business & Marketing
    "Marketing", "Sales", "Business Development", "Growth Hacking",
    "SEO", "Content Marketing", "Social Media", "Email Marketing",
    "Copywriting", "Public Relations", "Project Management", "Agile",
    "Scrum", "Fundraising", "Financial Modeling", "Accounting",
    "Legal", "Operations", "HR/Recruiting"
].sort();

interface SkillsAutocompleteProps {
    value: string[];
    onChange: (skills: string[]) => void;
    maxSkills?: number;
    placeholder?: string;
    className?: string;
}

export function SkillsAutocomplete({
    value = [],
    onChange,
    maxSkills = 20,
    placeholder = "Type a skill...",
    className = "",
}: SkillsAutocompleteProps) {
    const [inputValue, setInputValue] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter suggestions based on input
    useEffect(() => {
        if (!inputValue.trim()) {
            setSuggestions([]);
            return;
        }

        const query = inputValue.toLowerCase();
        const filtered = SUGGESTED_SKILLS.filter(skill =>
            skill.toLowerCase().includes(query) &&
            !value.includes(skill)
        ).slice(0, 5);

        setSuggestions(filtered);
        setIsOpen(true);
        setHighlightedIndex(-1);
    }, [inputValue, value]);

    const addSkill = (skill: string) => {
        const trimmedSkill = skill.trim();
        if (!trimmedSkill) return;

        if (value.length >= maxSkills) return;

        if (!value.includes(trimmedSkill)) {
            onChange([...value, trimmedSkill]);
        }

        setInputValue("");
        inputRef.current?.focus();
    };

    const removeSkill = (skillToRemove: string) => {
        onChange(value.filter(skill => skill !== skillToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (isOpen && highlightedIndex >= 0) {
                addSkill(suggestions[highlightedIndex]);
            } else if (inputValue) {
                addSkill(inputValue); // Allow custom skills
            }
        } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
            removeSkill(value[value.length - 1]);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(prev =>
                prev > 0 ? prev - 1 : suggestions.length - 1
            );
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    return (
        <div ref={wrapperRef} className={`space-y-3 ${className}`}>
            <div className="flex flex-wrap gap-2">
                {value.map((skill) => (
                    <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm"
                    >
                        {skill}
                        <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-white transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
            </div>

            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue && setIsOpen(true)}
                    placeholder={value.length === 0 ? placeholder : "Add another skill..."}
                    disabled={value.length >= maxSkills}
                    className="py-6"
                />

                {isOpen && (suggestions.length > 0 || inputValue) && (
                    <div className="absolute z-50 w-full mt-1 p-1 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl max-h-60 overflow-auto">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => addSkill(suggestion)}
                                className={`w-full px-4 py-2 text-left text-sm transition-colors rounded-xl flex items-center justify-between ${index === highlightedIndex
                                        ? "bg-indigo-600 text-white"
                                        : "text-zinc-300 hover:bg-white/5"
                                    }`}
                            >
                                <span>{suggestion}</span>
                                {index === highlightedIndex && <Check className="w-3 h-3" />}
                            </button>
                        ))}

                        {inputValue && !suggestions.includes(inputValue) && !value.includes(inputValue) && (
                            <button
                                type="button"
                                onClick={() => addSkill(inputValue)}
                                className="w-full px-3 py-2 text-left text-sm text-indigo-400 hover:bg-white/5 border-t border-white/5 flex items-center gap-2"
                            >
                                <Plus className="w-3 h-3" />
                                <span>Add "{inputValue}"</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-between text-xs text-zinc-500">
                <span>Press Enter to add</span>
                <span>{value.length}/{maxSkills} skills</span>
            </div>
        </div>
    );
}
