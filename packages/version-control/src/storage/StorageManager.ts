import fs from 'fs/promises';
import path from 'path';
import { Commit } from '../core/Commit';
import { Branch, BranchPointer } from '../core/Branch';
import { Logger } from '@bosdb/utils';

const logger = new Logger('StorageManager');

/**
 * StorageManager handles file-based storage for version control data
 */
export class StorageManager {
    private baseDir: string;
    private connectionId: string;

    constructor(connectionId: string) {
        this.connectionId = connectionId;
        // Store VC data in project root
        this.baseDir = path.join(process.cwd(), '.bosdb-vc', connectionId);
    }

    /**
     * Initialize storage directories
     */
    async initialize(): Promise<void> {
        const dirs = [
            this.baseDir,
            path.join(this.baseDir, 'commits'),
            path.join(this.baseDir, 'snapshots', 'schema'),
            path.join(this.baseDir, 'snapshots', 'data'),
            path.join(this.baseDir, 'branches'),
            path.join(this.baseDir, 'index'),
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }

        logger.info(`Storage initialized at: ${this.baseDir}`);
    }

    /**
     * Save a commit
     */
    async saveCommit(commit: Commit): Promise<void> {
        await this.initialize();
        const filePath = path.join(this.baseDir, 'commits', `${commit.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(commit, null, 2));
        logger.info(`Commit saved: ${commit.id}`);
    }

    /**
     * Load a commit
     */
    async loadCommit(commitId: string): Promise<Commit | null> {
        try {
            const filePath = path.join(this.baseDir, 'commits', `${commitId}.json`);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            logger.error(`Failed to load commit ${commitId}:`, error);
            return null;
        }
    }

    /**
     * Save a branch
     */
    async saveBranch(branch: Branch): Promise<void> {
        await this.initialize();
        const branches = await this.listBranches();
        const index = branches.findIndex(b => b.name === branch.name);

        if (index >= 0) {
            branches[index] = branch;
        } else {
            branches.push(branch);
        }

        const filePath = path.join(this.baseDir, 'branches', 'branches.json');
        await fs.writeFile(filePath, JSON.stringify(branches, null, 2));
        logger.info(`Branch saved: ${branch.name}`);
    }

    /**
     * Load a branch
     */
    async loadBranch(branchName: string): Promise<Branch | null> {
        const branches = await this.listBranches();
        return branches.find(b => b.name === branchName) || null;
    }

    /**
     * List all branches
     */
    async listBranches(): Promise<Branch[]> {
        try {
            const filePath = path.join(this.baseDir, 'branches', 'branches.json');
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet
            return [];
        }
    }

    /**
     * Delete a branch
     */
    async deleteBranch(branchName: string): Promise<void> {
        const branches = await this.listBranches();
        const filtered = branches.filter(b => b.name !== branchName);

        const filePath = path.join(this.baseDir, 'branches', 'branches.json');
        await fs.writeFile(filePath, JSON.stringify(filtered, null, 2));
        logger.info(`Branch deleted: ${branchName}`);
    }

    /**
     * Save HEAD pointer
     */
    async saveHead(head: BranchPointer): Promise<void> {
        await this.initialize();
        const filePath = path.join(this.baseDir, 'index', 'HEAD');
        await fs.writeFile(filePath, JSON.stringify(head, null, 2));
    }

    /**
     * Load HEAD pointer
     */
    async loadHead(): Promise<BranchPointer> {
        try {
            const filePath = path.join(this.baseDir, 'index', 'HEAD');
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // Default to main branch
            return {
                currentBranch: 'main',
                connectionId: this.connectionId,
            };
        }
    }

    /**
     * List all commits
     */
    async listCommits(): Promise<Commit[]> {
        try {
            const commitsDir = path.join(this.baseDir, 'commits');
            const files = await fs.readdir(commitsDir);

            const commits: Commit[] = [];
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const commitId = file.replace('.json', '');
                    const commit = await this.loadCommit(commitId);
                    if (commit) commits.push(commit);
                }
            }

            return commits.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
        } catch (error) {
            return [];
        }
    }
}
