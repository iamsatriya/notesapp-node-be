const { Pool } = require("pg");
const { nanoid } = require("nanoid");

const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const AuthorizationError = require("../../exceptions/AuthorizationError");

const { mapDBToModel } = require("../../utils");

class NotesService {
  constructor() {
    this._pool = new Pool();
  }

  async addNote({ title, body, tags, owner }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: "insert into notes values ($1, $2, $3, $4, $5, $6, $7) returning id",
      values: [id, title, body, tags, createdAt, updatedAt, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Catatan gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getNotes(owner) {
    const query = {
      text: "select * from notes where owner = $1",
      values: [owner],
    };

    const result = await this._pool.query(query);
    
    return result.rows.map(mapDBToModel);
  }

  async getNoteById(id) {
    const query = {
      text: "select * from notes where id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Catatan tidak ditemukan");
    }

    return result.rows.map(mapDBToModel)[0];
  }

  async editNoteById(id, { title, body, tags }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: "update notes set title = $1, body = $2, tags = $3, updated_at = $4 where id =$5 returning id",
      values: [title, body, tags, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Gagal memeperbarui catatan. Id tidak ditemukan");
    }
  }

  async deleteNoteById(id) {
    const query = {
      text: "delete from notes where id = $1 returning id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Catatan gagal dihapus. Id tidak ditemukan");
    }
  }

  async verifyNoteOwner(id, owner) {
    const query = {
      text: "select * from notes where id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Catatan tidak ditemukan");
    }

    const note = result.rows[0];

    if (note.owner !== owner) {
      throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
    }
  }
}

module.exports = NotesService;
