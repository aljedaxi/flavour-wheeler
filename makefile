%.json: %.yaml
	@yaml2json < $< > $@
