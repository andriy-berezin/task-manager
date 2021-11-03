require('../src/db/mongoose')
const Task = require('../src/models/task')

const deleteAndCount = async id => {
  const task = await Task.findByIdAndDelete(id)
  const count = await Task.countDocuments({ completed: false })
  return count
}

deleteAndCount('615cc46c4419fdaa7225c85e')
  .then(result => console.log('count -', result))
  .catch(error => console.log(error))
