HARImporter = ->
  @importString = (context, stringToImport) ->
    har = JSON.parse(stringToImport)

    # If the HAR was not valid JSON
    unless har or har.log or har.log.entries
      # To report an error, just throw a JavaScript Error
      throw new Error('Invalid input format (see https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html)')

    # Create a request group
    group = context.createRequestGroup('HAR import')

    for entry in har.log.entries
      # Create a request
      request = context.createRequest('Imported request', entry.request.method, entry.request.url)

      # Add headers if present in HAR data
      if entry.request.headers?
        for header in entry.request.headers
          # Filter out core headers
          unless header.name.substring(0, 1) == ':'
            request.setHeader header.name, header.value

      # Add body if present in HAR data
      if entry.request.postData?.text?
        request.body = entry.request.postData.text

      # Add the request inside the group
      group.appendChild(request)

    return true

  return

HARImporter.identifier = 'com.luckymarmot.PawExtensions.HARImporter'
HARImporter.title = 'HAR Importer'

# Tell Paw to use this importer
registerImporter(HARImporter)
