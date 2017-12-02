import HarRequestImporter from './HarRequestImporter'

@registerImporter
class HARImporter {
  static identifier = 'com.luckymarmot.PawExtensions.HARImporter'
  static title = 'HAR Importer'

  constructor() {
    this.options = {}
  }

  // 
  // Can Import?
  // 

  canImport(context, items) {
    let a = 0
    let b = 0
    for (let item of Array.from(items)) {
      a += this._canImportItem(context, item)
      b += 1
    }
    if (b > 0) {
      return a/b
    } else {
      return 0
    }
  }

  _canImportItem(context, item) {
    let har
    try {
      har = JSON.parse(item.content)
    } catch (error) {
      return 0
    }
    if (!(har && har.log && har.log.entries)) {
      return 0
    }
    if ((har.log.entries.length > 0) && !har.log.entries[0].request) {
      return 0
    }
    if (har.log.version === '1.2') {
      return 1
    }
    return 0.9
  }

  import(context, items, options) {
    let order = (options != null ? options.order : undefined) || null
    const parent = (options != null ? options.parent : undefined) || null
    for (let item of Array.from(items)) {
      const fileName = 'object' === typeof item.file ? item.file.name : null
      this._importStringToGroup(context, item.content, {
        parent,
        order,
        fileName: fileName,
        groupName: fileName !== null ? fileName : 'HAR file'
      })
      order += 1
    }
    return true
  }

  importString(context, str) {
    return this._importStringToGroup(context, str)
  }

  _importStringToGroup(context, str, options = {}) {
    const requestImporter = new HarRequestImporter(context, options)
    return requestImporter.importString(str)
  }
}
