
export class UserService {
  constructor(private db: Database) {}

  async getUser(id: string): Promise<User> {
    return this.db.findById(id);
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.remove(id);
  }
}
