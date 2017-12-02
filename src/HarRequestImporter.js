import base64 from 'base-64'
import utf8 from 'utf8'

const formatMs = t => {
  if (t > 1000) {
    return `${Math.round(t * 100000) / 100} seconds`
  }
  return `${Math.round(t * 10) / 10} ms`
}

class HarRequestImporter {
  constructor(context, options) {
    this.context = context
    this.options = options
    this._har = null
  }

  importString(str) {
    let har
    try {
      har = JSON.parse(str)
    } catch (e) {
      throw new Error('Invalid JSON for HAR import')
    }
    return this.importHar(har)
  }

  importHar(har) {
    // If the HAR was not valid JSON
    if ('object' !== typeof har ||
        'object' !== typeof har.log ||
        'object' !== typeof har.log.entries) {
      // To report an error, just throw a JavaScript Error
      throw new Error('Invalid input format (see https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html)')
    }
    this._har = har

    // Create the root group
    const group = this.createRootGroup()

    // Loop over log.entries and import a request for each
    for (const entry of Array.from(har.log.entries)) {
      const pawRequest = this.importEntry(entry)
      group.appendChild(pawRequest)
    }

    return true
  }

  createRootGroup() {
    const pawGroup = this.context.createRequestGroup(this.options.groupName || 'HAR file')

    // Set parent and order of group
    if (this.options.parent) {
      this.options.parent.appendChild(pawGroup)
    }
    if (this.options.order && (this.options.order >= 0)) {
      pawGroup.order = this.options.order
    }

    return pawGroup
  }

  importEntry(entry) {
    const pawRequest = this.createRequest(entry)
    this.importHeaders(entry, pawRequest)
    this.importBody(entry, pawRequest)
    this.importDescription(entry, pawRequest)
    return pawRequest
  }

  createRequest(entry) {
    var requestUrl = entry.request.url
    var requestMethod = entry.request.method
    if ('string' !== typeof requestUrl) {
      throw new Error('Invalid URL specified in HAR entry')
    }
    if ('string' !== typeof requestMethod) {
      requestMethod = 'GET'
    }

    // Request Name
    var requestName = 'Imported request'
    const m = requestUrl.match(/^[a-z]+\:\/\/([^\/]+)(\/[^?#]+)?/)
    if (m) {
      const hostname = m[1]
      const pathComponents = m[2] ? m[2].split('/') : []
      if (pathComponents.length > 1 && pathComponents[pathComponents.length - 1] !== '') {
        requestName = pathComponents[pathComponents.length - 1]
      }
      else if (pathComponents.length > 2 && pathComponents[pathComponents.length - 2] !== '') {
        requestName = pathComponents[pathComponents.length - 2]
      }
      else {
        requestName = hostname
      }
    }

    return this.context.createRequest(requestName, requestMethod, requestUrl)
  }

  importHeaders(entry, pawRequest) {
    const { headers } = entry.request
    if ('object' !== typeof headers) {
      return
    }

    for (const header of Array.from(headers)) {
      // Filter out core headers
      if (header.name.substring(0, 1) !== ':' && header.name.toLowerCase() !== "content-length") {
        pawRequest.setHeader(header.name, header.value)
      }
    }
  }

  importBody(entry, pawRequest) {
    const { postData } = entry.request
    if ('object' !== typeof postData) {
      return
    }

    const { text, mimeType, params } = postData

    if ('string' === typeof text) {
      if (mimeType.startsWith('application/json')) {
        try {
          pawRequest.jsonBody = JSON.parse(text)
        } catch (e) {
          pawRequest.body = text
        }
      } else {
        pawRequest.body = text
      }
    }
    else if ('object' === typeof params) {
      let bodyDict = {}
      for (const { name, value } of params) {
        bodyDict[name] = value
      }
      if (mimeType.startsWith('application/x-www-form-urlencoded')) {
        pawRequest.urlEncodedBody = bodyDict
      }
      else if (mimeType.startsWith('multipart/form-data')) {
        pawRequest.multipartBody = bodyDict
      }
    }
  }

  importDescription(entry, pawRequest) {
    const { fileName } = this.options
    const { log } = this._har
    const { creator } = log
    let description = ''

    // File info
    if (fileName) {
      description += `Imported from HAR file '${fileName}'\n`
    }
    if ('object' === typeof creator) {
      const { name, version } = creator
      description += `Created by ${name ? name : '(unknown)'}${version ? ` ${version}` : ''}\n`
    }

    description += '\n'
    description += 'Infos about the HAR entry:\n'

    // Timings
    const { timings } = entry
    if ('object' === typeof timings) {
      const { dns, connect, ssl, send, wait, receive} = timings
      description += '\n'
      description += '## Timings\n\n'
      if (dns >= 0) {
        description += `DNS resolution: ${formatMs(dns)}\n`
      }
      if (connect >= 0) {
        description += `TCP connection: ${formatMs(connect)}\n`
      }
      if (ssl >= 0) {
        description += `SSL/TLS negotiation: ${formatMs(ssl)}\n`
      }
      if (send >= 0) {
        description += `Send HTTP request: ${formatMs(send)}\n`
      }
      if (wait >= 0) {
        description += `Wait HTTP response: ${formatMs(wait)}\n`
      }
      if (receive >= 0) {
        description += `Receive HTTP response: ${formatMs(receive)}\n`
      }
    }

    // Response
    const { response } = entry
    if ('object' === typeof response) {
      const { headers, httpVersion, status, statusText, content } = response

      description += '\n'
      description += '## Response\n\n'

      if ('object' === typeof headers) {
        description += '### Headers\n\n'
        description += '```\n'
        description += `${httpVersion} ${status} ${statusText}\n`
        for (const { name, value } of headers) {
          description += `${name}: ${value}\n`
        }
        description += '```\n'
      }

      if ('object' === typeof content) {
        const { text, encoding } = content
        if ('string' === typeof text) {
          let decodedString = text
          if (encoding === 'base64') {
            decodedString = utf8.decode(base64.decode(text))
          }
          description += '\n'
          description += '### Body\n\n'
          description += decodedString
          description += '\n'
        }
      }
    }

    pawRequest.description = description
  }
}

export default HarRequestImporter
