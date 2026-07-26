/**
 * @jest-environment node
 */
const request = require('supertest');
const { startStreamingServer } = require('../streaming');

jest.mock('webtorrent', () => {
  return jest.fn().mockImplementation(() => {
    return {
      torrents: [],
      add: jest.fn().mockImplementation((magnet) => {
        const torrent = {
          infoHash: 'mockedHash123',
          name: 'Mocked Torrent',
          ready: true,
          files: [
            {
              name: 'video.mkv',
              length: 20,
              createReadStream: jest.fn().mockImplementation(() => {
                const { Readable } = require('stream');
                const s = new Readable();
                s.push('mocked video content');
                s.push(null);
                return s;
              })
            }
          ],
          on: jest.fn((event, cb) => {
            if (event === 'ready') cb();
          })
        };
        return torrent;
      }),
      destroy: jest.fn()
    };
  });
});

describe('Streaming Engine', () => {
  let engine;
  let server;

  beforeAll(async () => {
    engine = await startStreamingServer();
    server = engine.server;
  });

  afterAll((done) => {
    engine.destroy();
    server.close(done);
  });

  it('deve retornar erro 400 se não enviar magnet link', async () => {
    const response = await request(server).get('/api/stream');
    expect(response.status).toBe(400);
    expect(response.text).toBe('Magnet link is required');
  });

  it('deve adicionar o torrent e retornar o arquivo quando o magnet é enviado', async () => {
    const response = await request(server)
      .get('/api/stream')
      .query({ magnet: 'magnet:?xt=urn:btih:mockedHash123' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('video/x-matroska');
    expect(response.body.toString()).toBe('mocked video content');
  });
});
