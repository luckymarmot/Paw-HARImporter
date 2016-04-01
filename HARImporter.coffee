HARImporter = ->

  @canImport = (context, items) ->
    a = 0
    b = 0
    for item in items
      a += @_canImportItem(context, item)
      b += 1
    return if b > 0 then a/b else 0

  @_canImportItem = (context, item) ->
    try
      har = JSON.parse(item.content)
    catch error
      return 0
    if not (har and har.log and har.log.entries)
      return 0
    if har.log.entries.length > 0 and not har.log.entries[0].request
      return 0
    if har.log.version == '1.2'
      return 1
    return 0.9

  @import = (context, items, options) ->
    order = options?.order or null
    parent = options?.parent or null
    for item in items
      @_importStringToGroup(context, item.content, {
        parent: parent,
        order: order,
        groupName: item.file?.name or 'HAR file'
      })
      order += 1
    return true

  @importString = (context, str) ->
    return @_importStringToGroup(context, str)

  @_importStringToGroup = (context, str, options={}) ->
    try
      har = JSON.parse(str)
    catch e
      throw new Error('Invalid JSON for HAR import')

    # If the HAR was not valid JSON
    unless har or har.log or har.log.entries
      # To report an error, just throw a JavaScript Error
      throw new Error('Invalid input format (see https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/HAR/Overview.html)')

    # Create a request group
    group = context.createRequestGroup(options.groupName or 'HAR file')

    # Set parent and order of group
    if options.parent
      options.parent.appendChild(group)
    if options.order and options.order >= 0
      group.order = options.order

    for entry in har.log.entries
      # Create a request
      request = context.createRequest('Imported request', entry.request.method, entry.request.url)

      # Add headers if present in HAR data
      if entry.request.headers?
        for header in entry.request.headers
          # Filter out core headers
          if header.name.substring(0, 1) != ':' and header.name.toLowerCase() != "content-length"
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
