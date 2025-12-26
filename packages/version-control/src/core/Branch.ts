/**
 * Branch represents a line of development in version control
 */
export interface Branch {
    /** Branch name (e.g., 'main', 'feature/auth') */
    name: string;

    /** Commit ID that this branch points to */
    headCommitId: string;

    /** Whether this branch is protected from deletion */
    protected: boolean;

    /** Timestamp when branch was created */
    createdAt: Date;

    /** Optional description */
    description?: string;

    /** Connection ID this branch belongs to */
    connectionId: string;
}

/**
 * BranchPointer stores the current HEAD reference
 */
export interface BranchPointer {
    currentBranch: string;
    connectionId: string;
}

/**
 * Options for creating a new branch
 */
export interface CreateBranchOptions {
    name: string;
    connectionId: string;
    fromCommitId?: string;  // If not specified, uses current HEAD
    protected?: boolean;
    description?: string;
}

/**
 * Branch comparison result
 */
export interface BranchComparison {
    baseBranch: string;
    compareBranch: string;
    ahead: number;      // Commits ahead
    behind: number;     // Commits behind
    diverged: boolean;
    commonAncestor: string;
}
