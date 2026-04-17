import DiscordRpc from 'discord-rpc'

const CLIENT_ID = '1215618460231401482'

const IDLE_STATE = {
  details: 'In Library',
  state: 'xCloud & Console Streaming',
  largeImageKey: 'xstreaming_logo',
  largeImageText: 'XStreaming Desktop',
  instance: false,
}

export default class DiscordRpcHelper {
  private _client: DiscordRpc.Client | null = null
  private _connected = false
  private _appStartTime: Date
  private _playStartTime: Date | null = null
  private _reconnectTimer: NodeJS.Timeout | null = null
  private _currentGameName = ''
  private _currentGameImage = ''
  private _isPlaying = false

  private _enabled = false

  private _targetEnabled = false
  private _debounceTimer: NodeJS.Timeout | null = null

  private _opQueue: Promise<void> = Promise.resolve()

  constructor() {
    this._appStartTime = new Date()
    try { DiscordRpc.register(CLIENT_ID) } catch {}
  }

  private _connect() {
    if (!this._enabled) return

    try {
      const client = new DiscordRpc.Client({ transport: 'ipc' })
      this._client = client

      client.on('ready', () => {
        if (this._client !== client) return
        this._connected = true
        this._cancelReconnect()
        if (this._isPlaying) {
          this._applyPlaying(this._currentGameName, this._currentGameImage)
        } else {
          this._applyIdle()
        }
      })

      client.on('disconnected' as any, () => {
        if (this._client !== client) return
        this._connected = false
        if (this._enabled) this._scheduleReconnect()
      })

      client
        .login({ clientId: CLIENT_ID })
        .catch(() => {
          if (this._client !== client) return
          this._connected = false
          if (this._enabled) this._scheduleReconnect()
        })
    } catch {
      if (this._enabled) this._scheduleReconnect()
    }
  }

  private _scheduleReconnect() {
    if (this._reconnectTimer) return
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null
      if (this._enabled) this._connect()
    }, 15_000)
  }

  private _cancelReconnect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer)
      this._reconnectTimer = null
    }
  }

  private _destroyClient(): Promise<void> {
    this._cancelReconnect()
    const clientToDestroy = this._client
    this._client = null
    this._connected = false

    if (!clientToDestroy) return Promise.resolve()

    return clientToDestroy
      .clearActivity()
      .catch(() => { })
      .finally(() => clientToDestroy.destroy().catch(() => { }))
  }

  private _applyIdle() {
    if (!this._connected || !this._client) return
    this._client
      .setActivity({
        ...IDLE_STATE,
        startTimestamp: this._appStartTime,
      })
      .catch(() => { })
  }

  private _applyPlaying(gameName: string, gameImageUrl: string) {
    if (!this._connected || !this._client) return

    const largeImage =
      gameImageUrl && gameImageUrl.startsWith('http')
        ? gameImageUrl
        : 'xstreaming_logo'

    this._client
      .setActivity({
        details: gameName || 'Playing a game',
        state: 'Streaming via xCloud',
        largeImageKey: largeImage,
        largeImageText: gameName || 'Game',
        smallImageKey: 'xstreaming_logo',
        smallImageText: 'XStreaming Desktop',
        startTimestamp: this._playStartTime!,
        instance: false,
      })
      .catch(() => { })
  }

  enable() {
    this._targetEnabled = true
    this._scheduleUpdate()
  }

  disable() {
    this._targetEnabled = false
    this._scheduleUpdate()
  }

  private _scheduleUpdate() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer)
    
    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = null

      if (this._targetEnabled && !this._enabled) {
        this._enabled = true
        this._opQueue = this._opQueue.then(() => {
          if (this._enabled) this._connect()
        })
      } else if (!this._targetEnabled && this._enabled) {
        this._enabled = false
        this._opQueue = this._opQueue.then(() => this._destroyClient())
      }
    }, 500)
  }

  setIdle() {
    if (!this._targetEnabled) return
    this._isPlaying = false
    this._playStartTime = null
    this._applyIdle()
  }

  setPlaying(gameName: string, gameImageUrl: string) {
    if (!this._targetEnabled) return
    this._isPlaying = true
    this._playStartTime = new Date()
    this._currentGameName = gameName
    this._currentGameImage = gameImageUrl
    this._applyPlaying(gameName, gameImageUrl)
  }

  clearPlaying() {
    if (!this._targetEnabled) return
    this._isPlaying = false
    this._playStartTime = null
    this._applyIdle()
  }

  destroy() {
    this._targetEnabled = false
    this._enabled = false
    if (this._debounceTimer) clearTimeout(this._debounceTimer)
    this._debounceTimer = null
    this._opQueue = this._opQueue.then(() => this._destroyClient())
  }
}
