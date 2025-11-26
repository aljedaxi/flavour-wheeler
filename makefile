twinnings.json: twinnings.yaml
	@yaml2json < $< > $@
