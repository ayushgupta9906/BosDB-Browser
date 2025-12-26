import crypto from 'crypto';
import { Commit, CommitOptions, SchemaSnapshot, DataSnapshot } from './Commit';
import { Branch, CreateBranchOptions, BranchPointer } from './Branch';
import { StorageManager } from '../storage/StorageManager';
import { Logger } from '@bosdb/utils';

const logger = new Logger('Repository');

/**
 * Repository manages version control for a database connection
 */
export class DatabaseRepository {
    private connectionId: string;
    private storage: StorageManager;
    private currentBranch: string = 'main';

    constructor(connectionId: string) {
        this.connectionId = connectionId;
        this.storage = new StorageManager(connectionId);
    }

    /**
     * Initialize repository (create main branch if needed)
     */
    async initialize(): Promise<void> {
        logger.info(`Initializing repository for connection: ${this.connectionId}`);

        const branches = await this.storage.listBranches();
        if (branches.length === 0) {
            // Create main branch
            await this.storage.saveBranch({
                name: 'main',
                headCommitId: '',  // No commits yet
                protected: true,
                createdAt: new Date(),
                connectionId: this.connectionId,
            });

            // Set HEAD to main
            await this.storage.saveHead({
                currentBranch: 'main',
                connectionId: this.connectionId,
            });

            this.currentBranch = 'main';
            logger.info('Created main branch');
        } else {
            // Load current branch from HEAD
            const head = await this.storage.loadHead();
            this.currentBranch = head.currentBranch;
            logger.info(`Repository initialized, current branch: ${this.currentBranch}`);
        }
    }

    /**
     * Create a new commit
     */
    async createCommit(options: CommitOptions): Promise<Commit> {
        logger.info(`Creating commit: ${options.message}`);

        // Get current branch
        const branch = await this.storage.loadBranch(this.currentBranch);
        if (!branch) {
            throw new Error(`Branch ${this.currentBranch} not found`);
        }

        // Create schema and data snapshots (to be implemented by adapters)
        const schemaSnapshotId = await this.createSchemaSnapshot(options);
        const dataSnapshotId = await this.createDataSnapshot(options);

        // Generate commit ID
        const commitId = this.generateCommitId(options.message, options.author);

        // Create commit object
        const commit: Commit = {
            id: commitId,
            parentIds: branch.headCommitId ? [branch.headCommitId] : [],
            message: options.message,
            author: options.author,
            timestamp: new Date(),
            schemaSnapshotId,
            dataSnapshotId,
            branch: this.currentBranch,
            tags: [],
        };

        // Save commit
        await this.storage.saveCommit(commit);

        // Update branch HEAD
        branch.headCommitId = commitId;
        await this.storage.saveBranch(branch);

        logger.info(`Commit created: ${commitId}`);
        return commit;
    }

    /**
     * Create a new branch
     */
    async createBranch(options: CreateBranchOptions): Promise<Branch> {
        logger.info(`Creating branch: ${options.name}`);

        // Check if branch already exists
        const existing = await this.storage.loadBranch(options.name);
        if (existing) {
            throw new Error(`Branch ${options.name} already exists`);
        }

        // Determine base commit
        let baseCommitId = options.fromCommitId;
        if (!baseCommitId) {
            const currentBranch = await this.storage.loadBranch(this.currentBranch);
            if (!currentBranch) {
                throw new Error('Current branch not found');
            }
            baseCommitId = currentBranch.headCommitId;
        }

        // Create branch
        const branch: Branch = {
            name: options.name,
            headCommitId: baseCommitId,
            protected: options.protected || false,
            createdAt: new Date(),
            description: options.description,
            connectionId: this.connectionId,
        };

        await this.storage.saveBranch(branch);
        logger.info(`Branch created: ${options.name}`);
        return branch;
    }

    /**
     * Switch to a different branch
     */
    async switchBranch(branchName: string): Promise<void> {
        logger.info(`Switching to branch: ${branchName}`);

        const branch = await this.storage.loadBranch(branchName);
        if (!branch) {
            throw new Error(`Branch ${branchName} not found`);
        }

        // Update HEAD
        await this.storage.saveHead({
            currentBranch: branchName,
            connectionId: this.connectionId,
        });

        this.currentBranch = branchName;
        logger.info(`Switched to branch: ${branchName}`);
    }

    /**
     * Get commit history
     */
    async getHistory(limit?: number): Promise<Commit[]> {
        const branch = await this.storage.loadBranch(this.currentBranch);
        if (!branch || !branch.headCommitId) {
            return [];
        }

        const commits: Commit[] = [];
        let currentCommitId: string | undefined = branch.headCommitId;
        let count = 0;

        while (currentCommitId && (!limit || count < limit)) {
            const commit = await this.storage.loadCommit(currentCommitId);
            if (!commit) break;

            commits.push(commit);
            currentCommitId = commit.parentIds[0]; // Follow first parent
            count++;
        }

        return commits;
    }

    /**
     * List all branches
     */
    async listBranches(): Promise<Branch[]> {
        return this.storage.listBranches();
    }

    /**
     * Get current branch name
     */
    getCurrentBranch(): string {
        return this.currentBranch;
    }

    /**
     * Delete a branch
     */
    async deleteBranch(branchName: string): Promise<void> {
        const branch = await this.storage.loadBranch(branchName);
        if (!branch) {
            throw new Error(`Branch ${branchName} not found`);
        }

        if (branch.protected) {
            throw new Error(`Branch ${branchName} is protected`);
        }

        if (branchName === this.currentBranch) {
            throw new Error('Cannot delete current branch');
        }

        await this.storage.deleteBranch(branchName);
        logger.info(`Branch deleted: ${branchName}`);
    }

    // Private helper methods

    private generateCommitId(message: string, author: string): string {
        const timestamp = Date.now().toString();
        const content = `${message}${author}${timestamp}`;
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 40);
    }

    private async createSchemaSnapshot(options: CommitOptions): Promise<string> {
        // To be implemented: capture current schema
        // This will call the database adapter's createSnapshot method
        const snapshotId = `schema_${Date.now()}`;
        logger.info(`Created schema snapshot: ${snapshotId}`);
        return snapshotId;
    }

    private async createDataSnapshot(options: CommitOptions): Promise<string> {
        // To be implemented: capture current data
        // This will be delta-based for efficiency
        const snapshotId = `data_${Date.now()}`;
        logger.info(`Created data snapshot: ${snapshotId}`);
        return snapshotId;
    }
}
